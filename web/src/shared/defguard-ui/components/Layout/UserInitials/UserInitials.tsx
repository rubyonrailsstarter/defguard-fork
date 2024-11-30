import './style.scss';

import classNames from 'classnames';
import { HTMLMotionProps, motion } from 'framer-motion';
import { useMemo } from 'react';

type Props = HTMLMotionProps<'div'> & {
  first_name: string;
  last_name: string;
};

/**
 * Displays styled semi avatar box with user initials as a content.
 */
export const UserInitials = ({ first_name, last_name, className, ...rest }: Props) => {
  const cn = classNames('user-initials-box', className);

  const initials = useMemo(
    () => `${first_name[0].toUpperCase()}${last_name[0].toUpperCase()}`,
    [first_name, last_name],
  );

  return (
    <motion.span className={cn} {...rest}>
      <motion.span>{initials}</motion.span>
    </motion.span>
  );
};
