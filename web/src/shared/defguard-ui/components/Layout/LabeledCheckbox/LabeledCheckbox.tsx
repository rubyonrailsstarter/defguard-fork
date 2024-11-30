import './style.scss';

import classNames from 'classnames';

import { CheckBox } from '../Checkbox/CheckBox';
import { CheckBoxProps } from '../Checkbox/types';

type Props = CheckBoxProps & {
  label: string;
  className?: string;
};

/* Use when need checkbox with label outside of Form context.*/
export const LabeledCheckbox = ({
  label,
  onChange,
  value,
  disabled,
  className,
  ...rest
}: Props) => {
  const cn = classNames('labeled-checkbox', className, {
    disabled: disabled,
  });

  return (
    <div className={cn}>
      <CheckBox value={value} disabled={disabled} onChange={onChange} {...rest} />
      <label
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!disabled && onChange) {
            onChange(!value);
          }
        }}
      >
        {label}
      </label>
    </div>
  );
};
