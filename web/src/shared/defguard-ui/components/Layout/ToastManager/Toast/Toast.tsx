import './style.scss';

import classNames from 'classnames';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useToastsStore } from '../../../../hooks/toasts/useToastStore';
import SvgIconInfo from '../../../svg/IconInfo';
import SvgIconInfoSuccess from '../../../svg/IconInfoSuccess';
import SvgIconWarning from '../../../svg/IconWarning';
import { ToastProps, ToastType } from './types';

export const Toast = ({ data: { id, type, message, subMessage } }: ToastProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const timer = useRef(5);
  const timerTick = useRef<number | null>(null);
  const [timerControl, setTimerControl] = useState(true);
  const cn = useMemo(() => classNames('toast', type.valueOf()), [type]);
  const removeToast = useToastsStore((store) => store.removeToast);

  const getIcon = useMemo(() => {
    if (type === ToastType.INFO && !subMessage) {
      return <SvgIconInfo />;
    }
    if (type === ToastType.ERROR) {
      return <SvgIconWarning />;
    }
    if (type === ToastType.WARNING) {
      return <SvgIconInfo />;
    }
    if (type === ToastType.SUCCESS) {
      return <SvgIconInfoSuccess />;
    }
    return null;
  }, [type, subMessage]);

  useEffect(() => {
    if (timerControl) {
      timerTick.current = window.setInterval(() => {
        if (timer.current !== 0) {
          timer.current -= 1;
        }
        if (timer.current === 0) {
          removeToast(id);
        }
      }, 1000);
    } else {
      if (timerTick.current) {
        window.clearInterval(timerTick.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      if (timerTick.current) {
        window.clearInterval(timerTick.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerControl]);

  return (
    <motion.div
      className={cn}
      onHoverStart={() => setTimerControl(false)}
      onHoverEnd={() => setTimerControl(true)}
      onClick={() => removeToast(id)}
    >
      {getIcon}
      <p className="message">
        {message}
        {subMessage && subMessage.length && (
          <span className="sub-message">{subMessage}</span>
        )}
      </p>
    </motion.div>
  );
};
