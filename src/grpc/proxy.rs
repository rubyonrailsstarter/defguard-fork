use std::sync::Arc;

use ipnetwork::IpNetwork;
use sqlx::{PgPool, Transaction};
use tokio::sync::{broadcast::Sender, mpsc::UnboundedSender};
use tonic::Status;
use uaparser::UserAgentParser;

use super::{
    proto::{
        ActivateUserRequest, AdminInfo, Device as ProtoDevice, DeviceConfig as ProtoDeviceConfig,
        DeviceConfigResponse, EnrollmentStartRequest, EnrollmentStartResponse, ExistingDevice,
        InitialUserInfo, NewDevice, PasswordResetInitializeRequest, PasswordResetRequest,
        PasswordResetStartRequest, PasswordResetStartResponse,
    },
    utils::build_device_config_response,
    InstanceInfo,
};
use crate::{
    db::{
        models::{
            device::{DeviceConfig, DeviceInfo},
            enrollment::{Token, TokenError, ENROLLMENT_TOKEN_TYPE, PASSWORD_RESET_TOKEN_TYPE},
            polling_token::PollingToken,
        },
        Device, GatewayEvent, Id, Settings, User,
    },
    enterprise::db::models::enterprise_settings::EnterpriseSettings,
    handlers::{
        mail::{
            send_new_device_added_email, send_password_reset_email,
            send_password_reset_success_email,
        },
        user::check_password_strength,
    },
    headers::get_device_info,
    ldap::utils::{ldap_add_user, ldap_change_password},
    mail::Mail,
    server_config,
    templates::{self, TemplateLocation},
};

pub(super) struct ProxyHandler {
    pool: PgPool,
    wireguard_tx: Sender<GatewayEvent>,
    mail_tx: UnboundedSender<Mail>,
    user_agent_parser: Arc<UserAgentParser>,
    ldap_feature_active: bool,
}

impl ProxyHandler {
    #[must_use]
    pub fn new(
        pool: PgPool,
        wireguard_tx: Sender<GatewayEvent>,
        mail_tx: UnboundedSender<Mail>,
        user_agent_parser: Arc<UserAgentParser>,
    ) -> Self {
        // FIXME: check if LDAP feature is enabled
        let ldap_feature_active = true;
        Self {
            pool,
            wireguard_tx,
            mail_tx,
            user_agent_parser,
            ldap_feature_active,
        }
    }

    /// Checks if token provided with request corresponds to a valid enrollment session
    async fn validate_enrollment_session(&self, token: &Option<String>) -> Result<Token, Status> {
        info!("Validating enrollment session. Token: {token:?}");
        let Some(token) = token else {
            error!("Missing authorization header in request");
            return Err(Status::unauthenticated("Missing authorization header"));
        };
        let token = Token::find_by_id(&self.pool, token).await?;
        debug!("Found matching token, verifying validity: {token:?}.");
        if !token
            .token_type
            .as_ref()
            .is_some_and(|token_type| token_type == ENROLLMENT_TOKEN_TYPE)
        {
            error!(
                "Invalid token type used in enrollment process: {:?}",
                token.token_type
            );
            return Err(Status::permission_denied("invalid token"));
        }
        if token.is_session_valid(server_config().enrollment_session_timeout.as_secs()) {
            info!("Enrollment session validated: {token:?}");
            Ok(token)
        } else {
            error!("Enrollment session expired: {token:?}");
            Err(Status::unauthenticated("Session expired"))
        }
    }

    /// Sends given `GatewayEvent` to be handled by gateway GRPC server
    pub fn send_wireguard_event(&self, event: GatewayEvent) {
        if let Err(err) = self.wireguard_tx.send(event) {
            error!("Error sending WireGuard event {err}");
        }
    }

    pub async fn start_enrollment(
        &self,
        request: EnrollmentStartRequest,
    ) -> Result<EnrollmentStartResponse, Status> {
        debug!("Starting enrollment session, request: {request:?}");
        // fetch enrollment token
        debug!("Try to find an enrollment token {}.", request.token);
        let mut token = Token::find_by_id(&self.pool, &request.token).await?;

        let Some(token_type) = &token.token_type else {
            debug!("Invalid enrollment token, the token does not have specified type.");
            return Err(Status::permission_denied("invalid token"));
        };

        if token_type != ENROLLMENT_TOKEN_TYPE {
            error!("Invalid token type used while trying to start enrollment: {token_type}");
            return Err(Status::permission_denied("invalid token"));
        }

        // fetch related users
        let user = token.fetch_user(&self.pool).await?;
        let admin = token.fetch_admin(&self.pool).await?;

        debug!("Checking if user {}({}) is active", user.username, user.id);
        if !user.is_active {
            warn!(
                "Can't start enrollment for disabled user {}.",
                user.username
            );
            return Err(Status::permission_denied("user is disabled"));
        };
        info!(
            "User {}({}) is active, proceeding with enrollment",
            user.username, user.id
        );

        let mut transaction = self.pool.begin().await.map_err(|err| {
            error!("Failed to begin a transaction for enrollment: {err}");
            Status::internal("unexpected error")
        })?;

        // validate token & start session
        debug!(
            "Validating enrollment token and starting session for user {}({})",
            user.username, user.id,
        );
        let session_deadline = token
            .start_session(
                &mut transaction,
                server_config().enrollment_session_timeout.as_secs(),
            )
            .await?;
        info!(
            "Enrollment session started for user {}({})",
            user.username, user.id
        );

        debug!(
            "Retrieving settings for enrollment of user {}({}).",
            user.username, user.id
        );
        let settings = Settings::get_settings(&mut *transaction)
            .await
            .map_err(|err| {
                error!("Failed to get settings: {err}");
                Status::internal("unexpected error")
            })?;
        debug!("Settings: {settings:?}");

        debug!(
            "Retrieving enterprise settings for enrollment of user {}({}).",
            user.username, user.id
        );
        let enterprise_settings =
            EnterpriseSettings::get(&mut *transaction)
                .await
                .map_err(|err| {
                    error!("Failed to get enterprise settings: {err}");
                    Status::internal("unexpected error")
                })?;
        debug!("Enterprise settings: {enterprise_settings:?}");

        let vpn_setup_optional = settings.enrollment_vpn_step_optional;
        debug!(
            "Retrieving instance info for user {}({}).",
            user.username, user.id
        );
        let instance_info = InstanceInfo::new(settings, &user.username, &enterprise_settings);
        debug!("Instance info {instance_info:?}");

        debug!(
            "Preparing initial user info to send for user enrollment, user {}({}).",
            user.username, user.id
        );
        let (username, user_id) = (user.username.clone(), user.id);
        let user_info = InitialUserInfo::from_user(&self.pool, user)
            .await
            .map_err(|err| {
                error!(
                    "Failed to get user info for user {}({}): {err}",
                    username, user_id,
                );
                Status::internal("unexpected error")
            })?;
        debug!("User info {user_info:?}");

        debug!("Trying to get basic admin info...");
        let admin_info = admin.map(AdminInfo::from);
        debug!("Admin info {admin_info:?}");

        debug!(
            "Creating enrollment start response for user {}({}).",
            username, user_id,
        );
        let enterprise_settings =
            EnterpriseSettings::get(&mut *transaction)
                .await
                .map_err(|err| {
                    error!("Failed to get enterprise settings: {err}");
                    Status::internal("unexpected error")
                })?;
        let enrollment_settings = super::proto::Settings {
            vpn_setup_optional,
            only_client_activation: enterprise_settings.only_client_activation,
        };
        let response = super::proto::EnrollmentStartResponse {
            admin: admin_info,
            user: Some(user_info),
            deadline_timestamp: session_deadline.and_utc().timestamp(),
            final_page_content: token.get_welcome_page_content(&mut transaction).await?,
            instance: Some(instance_info.into()),
            settings: Some(enrollment_settings),
        };
        debug!("Response {response:?}");

        transaction.commit().await.map_err(|err| {
            error!("Failed to commit transaction: {err}");
            Status::internal("unexpected error")
        })?;

        Ok(response)
    }

    pub async fn activate_user(
        &self,
        request: ActivateUserRequest,
        req_device_info: Option<super::proto::DeviceInfo>,
    ) -> Result<(), Status> {
        debug!("Activating user account: {request:?}");
        let enrollment = self.validate_enrollment_session(&request.token).await?;

        let ip_address;
        let device_info;
        if let Some(info) = req_device_info {
            ip_address = info.ip_address.unwrap_or_default();
            let user_agent = info.user_agent.unwrap_or_default();
            device_info = get_device_info(&self.user_agent_parser, &user_agent);
        } else {
            ip_address = String::new();
            device_info = None;
        }
        debug!("IP address {}, device info {device_info:?}", ip_address);

        // check if password is strong enough
        debug!("Verifying password strength for user activation process.");
        if let Err(err) = check_password_strength(&request.password) {
            error!("Password not strong enough: {err}");
            return Err(Status::invalid_argument("password not strong enough"));
        }
        debug!("Password is strong enough to complete the user activation process.");

        // fetch related users
        let mut user = enrollment.fetch_user(&self.pool).await?;
        debug!(
            "Fetching user {} data to check if the user already has a password.",
            user.username
        );
        if user.has_password() {
            error!("User {} already activated", user.username);
            return Err(Status::invalid_argument("user already activated"));
        }
        debug!("User doesn't have a password yet. Continue user activation process...");

        debug!("Verify if the user is active or disabled.");
        if !user.is_active {
            warn!(
                "Can't finalize enrollment for disabled user {}",
                user.username
            );
            return Err(Status::invalid_argument("user is disabled"));
        }
        debug!("User is active.");

        let mut transaction = self.pool.begin().await.map_err(|err| {
            error!("Failed to begin transaction: {err}");
            Status::internal("unexpected error")
        })?;

        // update user
        info!("Update user details and set a new password.");
        user.phone = request.phone_number;
        user.set_password(&request.password);
        user.save(&mut *transaction).await.map_err(|err| {
            error!("Failed to update user {}: {err}", user.username);
            Status::internal("unexpected error")
        })?;
        debug!("Updating user details ended with success.");

        // sync with LDAP
        debug!("Add user to ldap: {}.", self.ldap_feature_active);
        if self.ldap_feature_active {
            debug!("Syncing with LDAP.");
            let _result = ldap_add_user(&self.pool, &user, &request.password).await;
        };

        debug!("Retriving settings to send welcome email...");
        let settings = Settings::get_settings(&mut *transaction)
            .await
            .map_err(|err| {
                error!("Failed to get settings: {err}");
                Status::internal("unexpected error")
            })?;
        debug!("Successfully retrived settings.");

        // send welcome email
        debug!("Try to send welcome email...");
        enrollment
            .send_welcome_email(
                &mut transaction,
                &self.mail_tx,
                &user,
                &settings,
                &ip_address,
                device_info.as_deref(),
            )
            .await?;

        // send success notification to admin
        debug!(
            "Trying to fetch admin data from the token to send notification about activating user."
        );
        let admin = enrollment.fetch_admin(&mut *transaction).await?;

        if let Some(admin) = admin {
            debug!("Send admin notification mail.");
            Token::send_admin_notification(
                &self.mail_tx,
                &admin,
                &user,
                &ip_address,
                device_info.as_deref(),
            )?;
        }

        transaction.commit().await.map_err(|err| {
            error!("Failed to commit transaction: {err}");
            Status::internal("unexpected error")
        })?;

        info!("User {} activated", user.username);
        Ok(())
    }

    pub async fn create_device(
        &self,
        request: NewDevice,
        req_device_info: Option<super::proto::DeviceInfo>,
    ) -> Result<DeviceConfigResponse, Status> {
        debug!("Adding new user device: {request:?}");
        let enrollment = self.validate_enrollment_session(&request.token).await?;

        // fetch related users
        let user = enrollment.fetch_user(&self.pool).await?;

        // add device
        debug!("Verifying if user {}({}) is active", user.username, user.id);
        if !user.is_active {
            error!(
                "Can't create device for disabled user {}({})",
                user.username, user.id
            );
            return Err(Status::invalid_argument(
                "can't add device to disabled user",
            ));
        }
        info!(
            "User {}({}) is active, proceeding with device creation, pubkey: {}",
            user.username, user.id, request.pubkey
        );

        let ip_address;
        let device_info;
        if let Some(info) = req_device_info {
            ip_address = info.ip_address.unwrap_or_default();
            let user_agent = info.user_agent.unwrap_or_default();
            device_info = get_device_info(&self.user_agent_parser, &user_agent);
        } else {
            ip_address = String::new();
            device_info = None;
        }
        debug!("IP address {}, device info {device_info:?}", ip_address);

        debug!(
            "Validating pubkey {} for device creation process for user {}({})",
            request.pubkey, user.username, user.id,
        );
        Device::validate_pubkey(&request.pubkey).map_err(|err| {
            error!(
                "Invalid pubkey {}, device won't be created for user {}({}): {err}",
                request.pubkey, user.username, user.id
            );
            Status::invalid_argument("invalid pubkey")
        })?;
        info!(
            "Pubkey {} is valid for device creation process for user {}({})",
            request.pubkey, user.username, user.id
        );

        // Make sure there is no device with the same pubkey, such state may lead to unexpected issues
        debug!(
            "Checking pubkey {} uniqueness for device creation process for user {}({}).",
            request.pubkey, user.username, user.id,
        );
        if let Some(device) = Device::find_by_pubkey(&self.pool, &request.pubkey)
            .await
            .map_err(|err| {
                error!(
                    "Failed to get device {} by its pubkey: {err}",
                    request.pubkey
                );
                Status::internal("unexpected error")
            })?
        {
            warn!(
                "User {}({}) failed to add device {}, identical pubkey ({}) already exists for device {}",
                user.username,
                user.id,
                request.name,
                request.pubkey,
                device.name
            );
            return Err(Status::invalid_argument("invalid key"));
        };
        info!(
            "Pubkey {} is unique for device creation process for user {}({}).",
            request.pubkey, user.username, user.id
        );

        let device = Device::new(
            request.name.clone(),
            request.pubkey.clone(),
            enrollment.user_id,
        );
        debug!(
            "Creating new device for user {}({}) {device:?}.",
            user.username, user.id,
        );

        let mut transaction = self.pool.begin().await.map_err(|err| {
            error!("Failed to begin transaction: {err}");
            Status::internal("unexpected error")
        })?;
        let device = device.save(&mut *transaction).await.map_err(|err| {
            error!(
                "Failed to save device {}, pubkey {} for user {}({}): {err}",
                request.name, request.pubkey, user.username, user.id,
            );
            Status::internal("unexpected error")
        })?;
        info!("New device created: {device:?}.");

        debug!(
            "Adding device {} to all existing user networks for user {}({}).",
            device.wireguard_pubkey, user.username, user.id,
        );
        let (network_info, configs) =
            device
                .add_to_all_networks(&mut transaction)
                .await
                .map_err(|err| {
                    error!(
                        "Failed to add device {} to existing networks: {err}",
                        device.name
                    );
                    Status::internal("unexpected error")
                })?;

        info!(
            "Added device {} to all existing user networks for user {}({})",
            device.wireguard_pubkey, user.username, user.id
        );
        debug!(
            "Sending DeviceCreated event to gateway for device {}, user {}({})",
            device.wireguard_pubkey, user.username, user.id,
        );
        self.send_wireguard_event(GatewayEvent::DeviceCreated(DeviceInfo {
            device: device.clone(),
            network_info,
        }));
        info!(
            "Sent DeviceCreated event to gateway for device {}, user {}({})",
            device.wireguard_pubkey, user.username, user.id,
        );

        debug!(
            "Fetching settings for device {} creation process for user {}({})",
            device.wireguard_pubkey, user.username, user.id,
        );
        let settings = Settings::get_settings(&mut *transaction)
            .await
            .map_err(|err| {
                error!(
            "Failed to fetch settings for device {} creation process for user {}({}): {err}",
            device.wireguard_pubkey, user.username, user.id,
);
                Status::internal("unexpected error")
            })?;
        debug!("Settings: {settings:?}");

        debug!(
            "Fetching enterprise settings for device {} creation process for user {}({})",
            device.wireguard_pubkey, user.username, user.id,
        );
        let enterprise_settings = EnterpriseSettings::get(&mut *transaction)
            .await
            .map_err(|err| {
                error!(
            "Failed to fetch enterprise settings for device {} creation process for user {}({}): {err}",
            device.wireguard_pubkey, user.username, user.id,
        );
                Status::internal("unexpected error")
            })?;
        debug!("Enterprise settings: {enterprise_settings:?}");

        // create polling token for further client communication
        debug!(
            "Creating polling token for further client communication for device {}, user {}({})",
            device.wireguard_pubkey, user.username, user.id,
        );
        let token = PollingToken::new(device.id)
            .save(&mut *transaction)
            .await
            .map_err(|err| {
                error!(
                    "Failed to save PollingToken for device {}, user {}({}): {err}",
                    device.wireguard_pubkey, user.username, user.id
                );
                Status::internal("failed to save polling token")
            })?;
        info!(
            "Created polling token for further client communication for device: {}, user {}({})",
            device.wireguard_pubkey, user.username, user.id,
        );

        transaction.commit().await.map_err(|err| {
            error!(
                "Failed to commit transaction, device {} won't be created for user {}({}): {err}",
                device.wireguard_pubkey, user.username, user.id,
            );
            Status::internal("unexpected error")
        })?;

        let template_locations: Vec<TemplateLocation> = configs
            .iter()
            .map(|c| TemplateLocation {
                name: c.network_name.clone(),
                assigned_ip: c.address.to_string(),
            })
            .collect();

        debug!(
            "Sending device created mail for device {}, user {}({})",
            device.wireguard_pubkey, user.username, user.id
        );
        send_new_device_added_email(
            &device.name,
            &device.wireguard_pubkey,
            &template_locations,
            &user.email,
            &self.mail_tx,
            Some(&ip_address),
            device_info.as_deref(),
        )
        .map_err(|_| Status::internal("error rendering email template"))?;

        info!(
            "Device {} assigned to user {}({}) and added to all networks.",
            device.name, user.username, user.id,
        );

        let response = DeviceConfigResponse {
            device: Some(device.into()),
            configs: configs.into_iter().map(Into::into).collect(),
            instance: Some(
                InstanceInfo::new(settings, &user.username, &enterprise_settings).into(),
            ),
            token: Some(token.token),
        };
        debug!("{response:?}.");

        Ok(response)
    }

    /// Get all information needed to update instance information for desktop client
    pub async fn get_network_info(
        &self,
        request: ExistingDevice,
    ) -> Result<DeviceConfigResponse, Status> {
        debug!("Getting network info for device: {:?}", request.pubkey);
        let _token = self.validate_enrollment_session(&request.token).await?;

        build_device_config_response(&self.pool, &request.pubkey, true).await
    }

    /// Checks if token provided with request corresponds to a valid password reset session
    async fn validate_password_reset_session(
        &self,
        token: &Option<String>,
    ) -> Result<Token, Status> {
        info!("Validating password reset session. Token: {token:?}");
        let Some(token) = token else {
            error!("Missing authorization header in request");
            return Err(Status::unauthenticated("Missing authorization header"));
        };
        let token = Token::find_by_id(&self.pool, token).await?;
        debug!("Found matching token, verifying validity: {token:?}.");
        if !token
            .token_type
            .as_ref()
            .is_some_and(|token_type| token_type == PASSWORD_RESET_TOKEN_TYPE)
        {
            error!(
                "Invalid token type used in password reset process: {:?}",
                token.token_type
            );
            return Err(Status::permission_denied("invalid token"));
        }

        if token.is_session_valid(server_config().enrollment_session_timeout.as_secs()) {
            info!("Password reset session validated: {token:?}.",);
            Ok(token)
        } else {
            error!("Password reset session expired: {token:?}");
            Err(Status::unauthenticated("Session expired"))
        }
    }

    pub async fn request_password_reset(
        &self,
        request: PasswordResetInitializeRequest,
        req_device_info: Option<super::proto::DeviceInfo>,
    ) -> Result<(), Status> {
        let config = server_config();
        debug!("Starting password reset request");

        let ip_address;
        let user_agent;
        if let Some(info) = req_device_info {
            ip_address = info.ip_address.unwrap_or_default();
            user_agent = info.user_agent.unwrap_or_default();
        } else {
            ip_address = String::new();
            user_agent = String::new();
        }

        let email = request.email;

        let user = User::find_by_email(&self.pool, email.to_string().as_str())
            .await
            .map_err(|_| {
                error!("Failed to fetch user by email: {email}");
                Status::internal("unexpected error")
            })?;

        let Some(user) = user else {
            // Do not return information whether user exists
            debug!("Password reset skipped for non-existing user {email}");
            return Ok(());
        };

        // Do not allow password change if user is disabled or not enrolled
        if !user.has_password() || !user.is_active {
            debug!(
                "Password reset skipped for disabled or not enrolled user {} ({email})",
                user.username
            );
            return Ok(());
        }

        let mut transaction = self.pool.begin().await.map_err(|_| {
            error!("Failed to begin transaction");
            Status::internal("unexpected error")
        })?;

        Token::delete_unused_user_password_reset_tokens(&mut transaction, user.id).await?;

        let enrollment = Token::new(
            user.id,
            None,
            Some(email.clone()),
            config.password_reset_token_timeout.as_secs(),
            Some(PASSWORD_RESET_TOKEN_TYPE.to_string()),
        );
        enrollment.save(&mut transaction).await?;

        transaction.commit().await.map_err(|_| {
            error!("Failed to commit transaction");
            Status::internal("unexpected error")
        })?;

        send_password_reset_email(
            &user,
            &self.mail_tx,
            config.enrollment_url.clone(),
            &enrollment.id,
            Some(&ip_address),
            Some(&user_agent),
        )?;

        info!(
            "Finished processing password reset request for user {}.",
            user.username
        );

        Ok(())
    }

    pub async fn start_password_reset(
        &self,
        request: PasswordResetStartRequest,
    ) -> Result<PasswordResetStartResponse, Status> {
        debug!("Starting password reset session: {request:?}");

        let mut token = Token::find_by_id(&self.pool, &request.token).await?;

        if !token
            .token_type
            .as_ref()
            .is_some_and(|token_type| token_type == PASSWORD_RESET_TOKEN_TYPE)
        {
            error!(
                "Invalid token type ({:?}) for password reset session",
                token.token_type
            );
            return Err(Status::permission_denied("invalid token"));
        }

        let user = token.fetch_user(&self.pool).await?;

        if !user.has_password() || !user.is_active {
            error!(
                "Can't start password reset for a disabled or not enrolled user {}.",
                user.username
            );
            return Err(Status::permission_denied(
                "user disabled or not yet enrolled",
            ));
        }

        let mut transaction = self.pool.begin().await.map_err(|_| {
            error!("Failed to begin transaction");
            Status::internal("unexpected error")
        })?;

        let session_deadline = token
            .start_session(
                &mut transaction,
                server_config().password_reset_session_timeout.as_secs(),
            )
            .await?;

        let response = PasswordResetStartResponse {
            deadline_timestamp: session_deadline.and_utc().timestamp(),
        };

        transaction.commit().await.map_err(|_| {
            error!("Failed to commit transaction");
            Status::internal("unexpected error")
        })?;

        info!(
            "Finished processing password reset session for user {}.",
            user.username
        );

        Ok(response)
    }

    pub async fn reset_password(
        &self,
        request: PasswordResetRequest,
        req_device_info: Option<super::proto::DeviceInfo>,
    ) -> Result<(), Status> {
        debug!("Starting password reset: {request:?}");
        let enrollment = self.validate_password_reset_session(&request.token).await?;

        let ip_address;
        let user_agent;
        if let Some(info) = req_device_info {
            ip_address = info.ip_address.unwrap_or_default();
            user_agent = info.user_agent.unwrap_or_default();
        } else {
            ip_address = String::new();
            user_agent = String::new();
        }

        if let Err(err) = check_password_strength(&request.password) {
            error!("Password not strong enough: {err}");
            return Err(Status::invalid_argument("password not strong enough"));
        }

        let mut user = enrollment.fetch_user(&self.pool).await?;

        if !user.is_active {
            error!(
                "Can't reset password for a disabled user {}.",
                user.username
            );
            return Err(Status::permission_denied("user disabled"));
        }

        let mut transaction = self.pool.begin().await.map_err(|_| {
            error!("Failed to begin transaction");
            Status::internal("unexpected error")
        })?;

        // update user
        user.set_password(&request.password);
        user.save(&mut *transaction).await.map_err(|err| {
            error!("Failed to update user {}: {err}", user.username);
            Status::internal("unexpected error")
        })?;

        // if self.ldap_feature_active {
        let _ = ldap_change_password(&self.pool, &user.username, &request.password).await;
        // };

        transaction.commit().await.map_err(|_| {
            error!("Failed to commit transaction");
            Status::internal("unexpected error")
        })?;

        send_password_reset_success_email(
            &user,
            &self.mail_tx,
            Some(&ip_address),
            Some(&user_agent),
        )?;

        Ok(())
    }
}

impl From<User<Id>> for AdminInfo {
    fn from(admin: User<Id>) -> Self {
        Self {
            name: format!("{} {}", admin.first_name, admin.last_name),
            phone_number: admin.phone,
            email: admin.email,
        }
    }
}

impl InitialUserInfo {
    async fn from_user(pool: &PgPool, user: User<Id>) -> Result<Self, sqlx::Error> {
        let enrolled = user.is_enrolled();
        let devices = user.user_devices(pool).await?;
        let device_names = devices.into_iter().map(|dev| dev.device.name).collect();
        Ok(Self {
            first_name: user.first_name,
            last_name: user.last_name,
            login: user.username,
            email: user.email,
            phone_number: user.phone,
            is_active: user.is_active,
            device_names,
            enrolled,
        })
    }
}

impl From<DeviceConfig> for ProtoDeviceConfig {
    fn from(config: DeviceConfig) -> Self {
        let allowed_ips = config
            .allowed_ips
            .iter()
            .map(IpNetwork::to_string)
            .collect::<Vec<String>>()
            .join(",");
        Self {
            network_id: config.network_id,
            network_name: config.network_name,
            config: config.config,
            endpoint: config.endpoint,
            assigned_ip: config.address.to_string(),
            pubkey: config.pubkey,
            allowed_ips,
            dns: config.dns,
            mfa_enabled: config.mfa_enabled,
            keepalive_interval: config.keepalive_interval,
        }
    }
}

impl From<Device<Id>> for ProtoDevice {
    fn from(device: Device<Id>) -> Self {
        Self {
            id: device.id,
            name: device.name,
            pubkey: device.wireguard_pubkey,
            user_id: device.user_id,
            created_at: device.created.and_utc().timestamp(),
        }
    }
}

impl Token {
    // Send configured welcome email to user after finishing enrollment
    async fn send_welcome_email(
        &self,
        transaction: &mut Transaction<'_, sqlx::Postgres>,
        mail_tx: &UnboundedSender<Mail>,
        user: &User<Id>,
        settings: &Settings,
        ip_address: &str,
        device_info: Option<&str>,
    ) -> Result<(), TokenError> {
        debug!("Sending welcome mail to {}", user.username);
        let mail = Mail {
            to: user.email.clone(),
            subject: settings.enrollment_welcome_email_subject.clone().unwrap(),
            content: self
                .get_welcome_email_content(&mut *transaction, ip_address, device_info)
                .await?,
            attachments: Vec::new(),
            result_tx: None,
        };
        match mail_tx.send(mail) {
            Ok(()) => {
                info!("Sent enrollment welcome mail to {}", user.username);
                Ok(())
            }
            Err(err) => {
                error!("Error sending welcome mail: {err}");
                Err(TokenError::NotificationError(err.to_string()))
            }
        }
    }

    // Notify admin that a user has completed enrollment
    fn send_admin_notification(
        mail_tx: &UnboundedSender<Mail>,
        admin: &User<Id>,
        user: &User<Id>,
        ip_address: &str,
        device_info: Option<&str>,
    ) -> Result<(), TokenError> {
        debug!(
            "Sending enrollment success notification for user {} to {}",
            user.username, admin.username
        );
        let mail = Mail {
            to: admin.email.clone(),
            subject: "[defguard] User enrollment completed".into(),
            content: templates::enrollment_admin_notification(
                user,
                admin,
                ip_address,
                device_info,
            )?,
            attachments: Vec::new(),
            result_tx: None,
        };
        match mail_tx.send(mail) {
            Ok(()) => {
                info!(
                    "Sent enrollment success notification for user {} to {}",
                    user.username, admin.username
                );
                Ok(())
            }
            Err(err) => {
                error!("Error sending welcome mail: {err}");
                Err(TokenError::NotificationError(err.to_string()))
            }
        }
    }
}