import './style.scss';

import classNames from 'classnames';
import { HTMLMotionProps, motion, TargetAndTransition } from 'framer-motion';
import { ReactNode, useMemo } from 'react';

import { useTheme } from '../../../hooks/theme/useTheme';

interface Props extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  customAnimate?: TargetAndTransition;
}

export const RowBox = ({
  children,
  className,
  customAnimate,
  disabled = false,
  ...rest
}: Props) => {
  const { colors } = useTheme();
  const cn = useMemo(
    () =>
      classNames('row-box', className, {
        disabled: disabled,
      }),
    [className, disabled],
  );

  const getAnimate = useMemo((): TargetAndTransition => {
    let res: TargetAndTransition = {
      borderColor: colors.borderPrimary,
      opacity: 1,
    };
    if (disabled) {
      res.opacity = 0.8;
    }
    if (customAnimate) {
      res = { ...res, ...customAnimate };
    }
    return res;
  }, [disabled, customAnimate, colors.borderPrimary]);

  return (
    <motion.div className={cn} initial={false} animate={getAnimate} {...rest}>
      {children}
    </motion.div>
  );
};
