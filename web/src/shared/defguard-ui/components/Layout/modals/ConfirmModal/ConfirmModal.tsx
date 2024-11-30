import './style.scss';

import classNames from 'classnames';
import { ReactNode, useMemo } from 'react';

import { Button } from '../../Button/Button';
import { ButtonSize, ButtonStyleVariant } from '../../Button/types';
import { Modal } from '../Modal/Modal';
import { ConfirmModalType } from './types';

interface Props {
  isOpen: boolean;
  title: string;
  submitText: string;
  type?: ConfirmModalType;
  subTitle?: string | ReactNode;
  cancelText?: string;
  loading?: boolean;
  id?: string;
  onSubmit: () => void;
  setIsOpen?: (v: boolean) => void;
  onClose?: () => void;
  afterClose?: () => void;
  onCancel?: () => void;
}

const baseClass = 'modal middle confirm';

/**
 * Reusable modal configuration for modals confirming an action.
 */
export const ConfirmModal = ({
  id,
  isOpen,
  setIsOpen,
  onClose,
  afterClose,
  type,
  title,
  loading,
  cancelText,
  submitText,
  onSubmit,
  subTitle,
  onCancel,
}: Props) => {
  const cn = useMemo(
    () =>
      classNames(baseClass, {
        warning: type === ConfirmModalType.WARNING,
      }),
    [type],
  );

  return (
    <Modal
      id={id}
      backdrop
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className={cn}
      onClose={onClose}
      afterClose={afterClose}
      disableClose={loading}
    >
      <p className="title">{title}</p>
      <p className="subtitle">{subTitle}</p>
      <section className="controls">
        <Button
          size={ButtonSize.LARGE}
          text={cancelText ?? 'Cancel'}
          onClick={() => {
            onCancel?.();
            setIsOpen?.(false);
            onClose?.();
          }}
        />
        <Button
          size={ButtonSize.LARGE}
          styleVariant={
            type === ConfirmModalType.WARNING
              ? ButtonStyleVariant.DELETE
              : ButtonStyleVariant.PRIMARY
          }
          loading={loading}
          onClick={onSubmit}
          text={submitText}
        />
      </section>
    </Modal>
  );
};
