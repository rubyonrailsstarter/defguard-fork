import { Key, ReactNode } from 'react';

export enum ListSortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type ListHeader = {
  text: string;
  key: Key;
  active?: boolean;
  sortable?: boolean;
  sortDirection?: ListSortDirection;
  onClick?: () => void;
  customRender?: () => ReactNode;
};

export type ListRowCell<T extends object> = {
  key: string;
  render: (context: T) => ReactNode;
  onClick?: (context: T) => void;
};

export type ListPadding = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export interface VirtualizedListProps<T extends object> {
  rowSize: number;
  data: T[];
  headers?: ListHeader[];
  cells?: ListRowCell<T>[];
  customRowRender?: (context: T, index?: number) => ReactNode;
  className?: string;
  id?: string;
  mobile?: {
    enabled: boolean;
    mobileRowSize: number;
    renderer: (context: T, index?: number) => ReactNode;
  };
  padding?: ListPadding;
  headerPadding?: ListPadding;
  onDefaultRowClick?: (context: T) => void;
}
