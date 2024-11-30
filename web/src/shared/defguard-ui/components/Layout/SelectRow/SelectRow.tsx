import './style.scss';

import classNames from 'classnames';
import { ReactNode, useMemo } from 'react';

import { CheckBox } from '../Checkbox/CheckBox';
import { RadioButton } from '../RadioButton/Radiobutton';

type Props = {
  selected: boolean;
  type?: 'checkbox' | 'radio';
  onClick?: () => void;
  onBoxClick?: () => void;
  children?: ReactNode;
  className?: string;
  highlightActive?: boolean;
  id?: string;
};

/**Row with checkbox on left */
export const SelectRow = ({
  selected,
  onClick,
  children,
  id,
  className,
  onBoxClick,
  type = 'checkbox',
  highlightActive = false,
}: Props) => {
  const cn = useMemo(
    () =>
      classNames('select-row', className, type, {
        highlight: highlightActive,
        active: selected,
      }),
    [className, highlightActive, selected, type],
  );

  return (
    <div onClick={onClick} id={id} className={cn}>
      {type === 'checkbox' && <CheckBox value={selected} onChange={onBoxClick} />}
      {type === 'radio' && (
        <RadioButton active={selected} onClick={() => onBoxClick?.()} />
      )}
      <div className="content">{children}</div>
    </div>
  );
};
