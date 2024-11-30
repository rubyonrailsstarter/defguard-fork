import { isUndefined, toNumber } from 'lodash-es';
import { ChangeEvent, useCallback, useMemo } from 'react';
import { FieldValues, useController, UseControllerProps } from 'react-hook-form';

import { Input } from '../../Layout/Input/Input';
import { InputFloatingErrors, InputProps } from '../../Layout/Input/types';

interface Props<T extends FieldValues>
  extends Omit<InputProps, 'floatingErrors' | 'onPaste'> {
  controller: UseControllerProps<T>;
  floatingErrors?: {
    title?: string;
    errorMessages?: string[];
  };
}
export const FormInput = <T extends FieldValues>({
  controller,
  floatingErrors,
  disabled,
  type,
  ...rest
}: Props<T>) => {
  const {
    field: { onChange, ...restField },
    fieldState: { isDirty, isTouched, error },
    formState: { isSubmitted },
  } = useController(controller);

  const isInvalid = useMemo(() => {
    if (disabled) return false;
    if (
      (!isUndefined(error) && (isDirty || isTouched)) ||
      (!isUndefined(error) && isSubmitted)
    ) {
      return true;
    }
    return false;
  }, [error, isDirty, isSubmitted, isTouched, disabled]);

  const floatingErrorsData = useMemo((): InputFloatingErrors | undefined => {
    if (floatingErrors && floatingErrors.title && error && error.types && isInvalid) {
      let errors: string[] = [];
      for (const val of Object.values(error.types)) {
        if (typeof val === 'string') {
          errors.push(val);
        }
        if (Array.isArray(val)) {
          errors = [...errors, ...val];
        }
      }
      if (floatingErrors.errorMessages && floatingErrors.errorMessages.length) {
        errors = [...errors, ...floatingErrors.errorMessages];
      }
      return {
        title: floatingErrors.title,
        errorMessages: errors,
      };
    }
    return undefined;
  }, [error, floatingErrors, isInvalid]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (type === 'number') {
        if (value === '') {
          onChange('');
          return;
        }
        const parsed = toNumber(value);
        if (!isNaN(parsed)) {
          onChange(parsed);
        }
      } else {
        onChange(value);
      }
    },
    [onChange, type],
  );

  const getInputType = useMemo(() => {
    if (type === 'number') {
      return 'text';
    }
    return type;
  }, [type]);

  return (
    <Input
      data-testid={`field-${controller.name}`}
      {...rest}
      {...restField}
      invalid={isInvalid}
      errorMessage={error?.message}
      floatingErrors={floatingErrorsData}
      disabled={disabled}
      onChange={handleInputChange}
      type={getInputType}
    />
  );
};
