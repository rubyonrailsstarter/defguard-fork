export interface CheckBoxProps {
  value: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
  'data-test-id'?: string;
  id?: string;
}
