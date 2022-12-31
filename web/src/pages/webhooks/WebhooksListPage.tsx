import './style.scss';

import { useMutation, useQuery } from '@tanstack/react-query';
import { clone, isUndefined, orderBy } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import useBreakpoint from 'use-breakpoint';

import Button, {
  ButtonSize,
  ButtonStyleVariant,
} from '../../shared/components/layout/Button/Button';
import ConfirmModal from '../../shared/components/layout/ConfirmModal/ConfirmModal';
import { EditButton } from '../../shared/components/layout/EditButton/EditButton';
import {
  EditButtonOption,
  EditButtonOptionStyleVariant,
} from '../../shared/components/layout/EditButton/EditButtonOption';
import LoaderSpinner from '../../shared/components/layout/LoaderSpinner/LoaderSpinner';
import NoData from '../../shared/components/layout/NoData/NoData';
import PageContainer from '../../shared/components/layout/PageContainer/PageContainer';
import { Search } from '../../shared/components/layout/Search/Search';
import {
  ListHeader,
  ListRowCell,
  ListSortDirection,
  VirtualizedList,
} from '../../shared/components/layout/VirtualizedList/VirtualizedList';
import {
  IconCheckmarkGreen,
  IconDeactivated,
} from '../../shared/components/svg';
import SvgIconPlusWhite from '../../shared/components/svg/IconPlusWhite';
import { deviceBreakpoints } from '../../shared/constants';
import { useModalStore } from '../../shared/hooks/store/useModalStore';
import useApi from '../../shared/hooks/useApi';
import { useToaster } from '../../shared/hooks/useToaster';
import { MutationKeys } from '../../shared/mutations';
import { QueryKeys } from '../../shared/queries';
import { Webhook } from '../../shared/types';
import { WebhookModal } from './modals/WebhookModal/WebhookModal';

export const WebhooksListPage = () => {
  const { breakpoint } = useBreakpoint(deviceBreakpoints);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | undefined>(
    undefined
  );
  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredWebhooks, setFilteredWebhooks] = useState<Webhook[]>([]);
  const setWebhookModalState = useModalStore((state) => state.setWebhookModal);

  const {
    webhook: { getWebhooks, deleteWebhook },
  } = useApi();

  const toaster = useToaster();

  const { mutate: deleteWebhookMutation, isLoading: deleteWebhookIsLoading } =
    useMutation([MutationKeys.DELETE_WEBHOOK], deleteWebhook, {
      onSuccess: () => {
        toaster.success('Webhook deleted.');
        setDeleteModalOpen(false);
      },
      onError: (err) => {
        toaster.error('Error has occurred.');
        setDeleteModalOpen(false);
        console.error(err);
      },
    });

  const { data: webhooks, isLoading } = useQuery(
    [QueryKeys.FETCH_WEBHOOKS],
    getWebhooks
  );

  const getHeaders = useMemo(() => {
    const res: ListHeader[] = [
      {
        key: 'url',
        text: 'Url',
        active: true,
        sortDirection: ListSortDirection.ASC,
      },
      {
        key: 'description',
        text: 'Description',
        sortable: false,
      },
      {
        key: 'status',
        text: 'Status',
        sortable: false,
      },
      {
        key: 'actions',
        text: 'Actions',
        sortable: false,
      },
    ];
    return res;
  }, []);

  const getCells = useMemo(() => {
    const res: ListRowCell<Webhook>[] = [
      {
        key: 'url',
        render: (context) => <span>{context.url}</span>,
      },
      {
        key: 'description',
        render: (context) => <span>{context.description}</span>,
      },
      {
        key: 'status',
        render: (context) =>
          context.enabled ? (
            <>
              <IconCheckmarkGreen /> <span>Enabled</span>
            </>
          ) : (
            <>
              <IconDeactivated /> <span>Disabled</span>
            </>
          ),
      },
      {
        key: 'actions',
        render: (context) => (
          <EditButton>
            <EditButtonOption
              text="Edit"
              onClick={() =>
                setWebhookModalState({ visible: true, webhook: context })
              }
            />
            <EditButtonOption text={context.enabled ? 'Disable' : 'Enable'} />
            <EditButtonOption
              text="Delete"
              styleVariant={EditButtonOptionStyleVariant.WARNING}
              onClick={() => setWebhookToDelete(context)}
            />
          </EditButton>
        ),
      },
    ];
    return res;
  }, [setWebhookModalState]);

  useEffect(() => {
    if (webhooks) {
      const c = clone(webhooks);
      if (searchValue && searchValue.length) {
        const filtered = c.filter((webhook) =>
          webhook.url.toLowerCase().includes(searchValue.toLowerCase())
        );
        const ordered = orderBy(filtered, ['id'], ['desc']);
        setFilteredWebhooks(ordered);
      } else {
        setFilteredWebhooks(webhooks);
      }
    } else {
      setFilteredWebhooks([]);
    }
  }, [webhooks, searchValue]);

  const getListPadding = useMemo(() => {
    if (breakpoint === 'desktop') {
      return {
        left: 60,
        right: 60,
      };
    }
    return {
      left: 20,
      right: 20,
    };
  }, [breakpoint]);

  return (
    <PageContainer id="webhooks-list-page">
      <header>
        <h1>Webhooks</h1>
        <Search
          placeholder="Find webhook by url"
          initialValue={searchValue}
          debounceTiming={500}
          onDebounce={setSearchValue}
        />
      </header>
      <section className="actions">
        <div className="items-count">
          <span>All webhooks</span>
          <div className="count">
            <span>{webhooks?.length ?? 0}</span>
          </div>
        </div>
        <div className="controls">
          {breakpoint === 'mobile' ? (
            <Search
              placeholder="Find webhooks"
              onChange={(value) => setSearchValue(value)}
              initialValue={searchValue}
            />
          ) : null}
          <Button
            className="add-item"
            onClick={() =>
              setWebhookModalState({ visible: true, webhook: undefined })
            }
            size={ButtonSize.SMALL}
            styleVariant={ButtonStyleVariant.PRIMARY}
            text="Add new"
            icon={<SvgIconPlusWhite />}
          />
        </div>
      </section>
      {isLoading || (isUndefined(webhooks) && <LoaderSpinner size={180} />)}
      {!isLoading && filteredWebhooks && filteredWebhooks.length === 0 && (
        <NoData customMessage="No webhooks found." />
      )}
      {!isLoading && filteredWebhooks && filteredWebhooks.length > 0 && (
        <VirtualizedList
          data={filteredWebhooks}
          cells={getCells}
          headers={getHeaders}
          padding={getListPadding}
          rowSize={70}
          headerPadding={{
            left: 50,
            right: 15,
          }}
        />
      )}
      <WebhookModal />
      <ConfirmModal
        title="Delete webhook"
        subTitle="Selected webhook will be deleted."
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        onSubmit={() => {
          if (webhookToDelete) {
            deleteWebhookMutation(webhookToDelete.id);
          }
        }}
        submitText={'Delete'}
        loading={deleteWebhookIsLoading}
      />
    </PageContainer>
  );
};