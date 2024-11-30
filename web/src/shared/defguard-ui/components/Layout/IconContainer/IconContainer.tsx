import './style.scss';

import classNames from 'classnames';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
};

// this is a temporary solution for icons with broken viewbox
export const IconContainer = ({ children, id, className }: Props) => {
  const cn = classNames('icon-wrapper', className);

  return (
    <div className={cn} id={id}>
      {children}
    </div>
  );
};
