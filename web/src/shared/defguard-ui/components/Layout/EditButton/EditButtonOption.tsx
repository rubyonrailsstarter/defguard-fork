import classNames from 'classnames';
import { HTMLMotionProps, motion } from 'framer-motion';

import { EditButtonOptionStyleVariant } from './types';

interface EditButtonOptionProps extends HTMLMotionProps<'button'> {
  text: string;
  styleVariant?: EditButtonOptionStyleVariant;
}

export const EditButtonOption = ({
  text,
  disabled,
  className,
  styleVariant = EditButtonOptionStyleVariant.STANDARD,
  ...rest
}: EditButtonOptionProps) => {
  const cn = classNames(`variant-${styleVariant.valueOf().toLowerCase()}`, className);
  return (
    <motion.button disabled={disabled} className={cn} {...rest}>
      {text}
    </motion.button>
  );
};
