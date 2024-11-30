import './style.scss';

import classNames from 'classnames';
import { useMemo } from 'react';

import SvgIconX from '../../../svg/IconX';
import { Modal } from '../Modal/Modal';
import { ModalProps } from '../Modal/types';

export interface ModalWithTitleProps extends ModalProps {
  title?: string;
}

export const ModalWithTitle = ({
  children,
  title,
  className,
  isOpen,
  onClose,
  setIsOpen,
  disableClose = false,
  ...rest
}: ModalWithTitleProps) => {
  const cn = useMemo(() => classNames('titled', className), [className]);
  return (
    <Modal
      onClose={onClose}
      setIsOpen={setIsOpen}
      className={cn}
      isOpen={isOpen}
      disableClose={disableClose}
      {...rest}
    >
      {!disableClose && (
        <button
          className="close"
          onClick={() => {
            onClose && onClose();
            setIsOpen && setIsOpen(false);
          }}
        >
          <SvgIconX />
        </button>
      )}
      {title && title.length > 0 && (
        <div className="header">
          <p className="title">{title}</p>
        </div>
      )}
      {children && <div className="content">{children}</div>}
    </Modal>
  );
};
