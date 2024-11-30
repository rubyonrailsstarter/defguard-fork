import { Key, ReactNode } from 'react';

export type CardTabProps = {
  content: ReactNode;
  active?: boolean;
  onClick: () => void;
};

export type CardTabsData = CardTabProps & {
  key: Key;
};
