import './style.scss';

import classNames from 'classnames';
import { isUndefined } from 'lodash-es';
import { HTMLProps, ReactNode, useEffect, useMemo, useState } from 'react';

import SvgIconInfo from '../../svg/IconInfo';
import SvgIconInfoSuccess from '../../svg/IconInfoSuccess';
import SvgIconWarning from '../../svg/IconWarning';
import SvgIconX from '../../svg/IconX';
import { MessageBoxType } from './types';
import { readMessageBoxVisibility, writeMessageBoxVisibility } from './utils';

interface Props extends HTMLProps<HTMLDivElement> {
  message?: string | ReactNode;
  type?: MessageBoxType;
  dismissId?: string;
  children?: ReactNode;
}

/**
 * Styled box with message.
 */
export const MessageBox = ({
  message,
  className,
  dismissId,
  children,
  type = MessageBoxType.INFO,
  ...props
}: Props) => {
  const [visible, setVisible] = useState<boolean>(isUndefined(dismissId) ? true : false);

  const dismissable = !isUndefined(dismissId);

  const getClassName = useMemo(() => {
    return classNames('message-box', className, type.valueOf());
  }, [className, type]);

  const getIcon = useMemo(() => {
    switch (type) {
      case MessageBoxType.INFO:
        return <SvgIconInfo />;
      case MessageBoxType.SUCCESS:
        return <SvgIconInfoSuccess />;
      case MessageBoxType.WARNING:
        return <SvgIconInfo />;
      case MessageBoxType.ERROR:
        return <SvgIconWarning />;
    }
  }, [type]);

  const renderMessage = useMemo(() => {
    if (!isUndefined(children)) {
      return children;
    }
    if (typeof message === 'string') {
      return <p>{message}</p>;
    }
    return message;
  }, [message, children]);

  useEffect(() => {
    if (dismissId && dismissId.length) {
      const visibility = readMessageBoxVisibility(dismissId);
      setVisible(visibility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className={getClassName} {...props}>
      <div className="icon-container">{getIcon}</div>
      <div className="message">{renderMessage}</div>
      {dismissable && (
        <button
          className="dismiss"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            writeMessageBoxVisibility(dismissId);
            setVisible(false);
          }}
        >
          <SvgIconX />
        </button>
      )}
    </div>
  );
};
