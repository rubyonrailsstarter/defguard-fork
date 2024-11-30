import { ReactNode } from 'react';

export interface SelectOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
  key: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}

export enum SelectSizeVariant {
  STANDARD = 'STANDARD',
  SMALL = 'SMALL',
}

export type SelectSelectedValue = {
  key: string | number;
  displayValue: string;
};

export interface SelectProps<T> {
  options: SelectOption<T>[];
  // Function that translates value into displayable object, because options are separated from selected value
  renderSelected: (value: T) => SelectSelectedValue;
  // When in single mode emits change
  onChangeSingle?: (result: T) => void;
  // When in multi mode emits change
  onChangeArray?: (result: T[]) => void;
  // needs to be provided when T is an object, should return value that is unique so option can be indentify
  identify?: (val: T) => string | number;
  selected?: T | T[];
  // called before removing selected value. Only available in multi mode.
  onRemove?: (removedValue: T) => void;
  // Multi mode flag, tells if selected values can be removed ( does not affect options )
  // @defaultValue `true`
  disposable?: boolean;
  // optional, designed to use when API calls are needed in order to search for new options
  onSearch?: (value?: string) => void;
  // used before onSearch fires to filter out options that are present it is requied if searchable flag is present
  searchFilter?: (searchValue: string, options: SelectOption<T>[]) => SelectOption<T>[];
  onCreate?: () => void;
  invalid?: boolean;
  errorMessage?: string;
  searchMinLength?: number;
  searchDebounce?: number;
  searchable?: boolean;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  labelExtras?: ReactNode;
  disableLabelColon?: boolean;
  inForm?: boolean;
  disableOpen?: boolean;
  sizeVariant?: SelectSizeVariant;
  addOptionLabel?: string;
  'data-testid'?: string;
}

export type SelectFloatingOption<T> = SelectOption<T> & {
  selected: boolean;
};
