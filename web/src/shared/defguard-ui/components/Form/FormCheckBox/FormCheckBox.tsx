import './style.scss';

import { isUndefined } from 'lodash-es';
import { useId } from 'react';
import { FieldValues, useController, UseControllerProps } from 'react-hook-form';

import { CheckBox } from '../../Layout/Checkbox/CheckBox';
import { CheckBoxProps } from '../../Layout/Checkbox/types';

interface Props<T extends FieldValues> extends Partial<CheckBoxProps> {
  controller: UseControllerProps<T>;
  label?: string;
  labelPlacement?: 'left' | 'right';
}

export const FormCheckBox = <T extends FieldValues>({
  controller,
  label,
  labelPlacement,
  ...rest
}: Props<T>) => {
  const fieldId = useId();

  const {
    field: { value, onChange },
  } = useController(controller);

  const renderLabel = () => {
    if (label) {
      return (
        <label
          htmlFor={fieldId}
          onClick={() => {
            onChange(!value);
          }}
        >
          {label}
        </label>
      );
    }
    return null;
  };

  return (
    <div className="form-checkbox">
      {labelPlacement === 'left' && !isUndefined(label) && renderLabel()}
      <CheckBox
        id={fieldId}
        data-testid={`field-${controller.name}`}
        {...rest}
        value={value}
        onChange={(val) => {
          onChange(val);
        }}
      />
      {labelPlacement === 'right' && !isUndefined(label) && renderLabel()}
    </div>
  );
};
