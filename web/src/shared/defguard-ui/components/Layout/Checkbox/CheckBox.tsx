import './style.scss';

import classNames from 'classnames';
import { useMemo } from 'react';

import SvgCheckboxChecked from '../../svg/CheckboxChecked';
import SvgCheckboxUnchecked from '../../svg/CheckboxUnchecked';
import { CheckBoxProps } from './types';

export const CheckBox = ({
  value,
  onChange,
  disabled = false,
  ...rest
}: CheckBoxProps) => {
  const checked = useMemo(() => (Number(value) ? true : false), [value]);

  const cn = useMemo(
    () =>
      classNames('checkbox', {
        checked: checked,
        unchecked: !checked,
        disabled: disabled,
      }),
    [checked, disabled],
  );

  return (
    <div
      {...rest}
      className={cn}
      onClick={() => {
        if (onChange && !disabled) {
          onChange(!value);
        }
      }}
    >
      {checked ? (
        <SvgCheckboxChecked className="checked" />
      ) : (
        <SvgCheckboxUnchecked className="unchecked" />
      )}
    </div>
  );
};
