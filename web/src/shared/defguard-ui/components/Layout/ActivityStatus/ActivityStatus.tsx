import './style.scss';

import classNames from 'classnames';
import { HTMLProps, useMemo } from 'react';

import { ActivityIcon } from '../../icons/ActivityIcon/ActivityIcon';
import { ActivityIconVariant } from '../../icons/ActivityIcon/types';
import { ActivityType } from './types';

type Props = HTMLProps<HTMLDivElement> & {
  connectionStatus?: ActivityType;
  message?: string;
  // reverse order of elements
  reversed?: boolean;
};

// styled status info, name was part of old design
export const ActivityStatus = ({
  connectionStatus = ActivityType.SUCCESS,
  message,
  className,
  reversed = false,
  ...rest
}: Props) => {
  const getIconType = useMemo((): ActivityIconVariant => {
    switch (connectionStatus) {
      case ActivityType.SUCCESS:
        return ActivityIconVariant.CONNECTED;
      case ActivityType.ERROR:
        return ActivityIconVariant.ERROR;
      case ActivityType.WARNING:
        return ActivityIconVariant.DISCONNECTED;
    }
  }, [connectionStatus]);

  const cn = classNames(
    'activity-status',
    className,
    `variant-${connectionStatus.valueOf()}`,
    {
      reversed: reversed,
    },
  );

  return (
    <div className={cn} {...rest}>
      <ActivityIcon status={getIconType} />
      {message && message.length > 0 && <p className="message">{message}</p>}
    </div>
  );
};
