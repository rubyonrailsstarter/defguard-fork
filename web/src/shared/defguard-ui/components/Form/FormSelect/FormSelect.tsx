import { isUndefined } from 'lodash-es';
import { useMemo } from 'react';
import { FieldValues, useController, UseControllerProps } from 'react-hook-form';

import { Select } from '../../Layout/Select/Select';
import { SelectProps } from '../../Layout/Select/types';

interface Props<T extends FieldValues, Y> extends SelectProps<Y> {
  controller: UseControllerProps<T>;
}

export const FormSelect = <T extends FieldValues, Y>({
  controller,
  ...rest
}: Props<T, Y>) => {
  const {
    field,
    fieldState: { isDirty, isTouched, error },
    formState: { isSubmitted },
  } = useController(controller);

  const isInvalid = useMemo(() => {
    if (
      (!isUndefined(error) && (isDirty || isTouched)) ||
      (!isUndefined(error) && isSubmitted)
    ) {
      return true;
    }
    return false;
  }, [error, isDirty, isSubmitted, isTouched]);

  return (
    <Select
      {...rest}
      inForm={true}
      selected={field.value}
      invalid={isInvalid}
      errorMessage={error?.message}
      onChangeSingle={(res) => field.onChange(res)}
      onChangeArray={(res) => field.onChange(res)}
    />
  );
};
