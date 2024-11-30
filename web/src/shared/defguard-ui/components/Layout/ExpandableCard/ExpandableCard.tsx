import './style.scss';

import classNames from 'classnames';
import { motion } from 'framer-motion';
import { isUndefined } from 'lodash-es';
import { ReactNode, useMemo, useState } from 'react';

import SvgIconHamburgerDotted from '../../svg/IconHamburgerDotted';

interface Props {
  children?: ReactNode;
  expanded?: boolean;
  title: string;
  actions?: ReactNode[];
  onChange?: () => void;
  disableExpand?: boolean;
  topExtras?: ReactNode;
  id?: string;
  className?: string;
}

export const ExpandableCard = ({
  children,
  title,
  actions,
  onChange,
  expanded,
  topExtras,
  id,
  className,
  disableExpand = false,
}: Props) => {
  const cn = useMemo(
    () =>
      classNames('expandable-card', className, {
        expanded,
      }),
    [expanded, className],
  );

  const controlledOutside = useMemo(() => !isUndefined(expanded), [expanded]);

  const [localExpanded, setLocalExpanded] = useState(false);

  return (
    <motion.div id={id} className={cn}>
      <div className="top">
        <button
          type="button"
          onClick={() => {
            if (!disableExpand && controlledOutside && onChange) {
              onChange();
            }
            if (!disableExpand && !controlledOutside) {
              setLocalExpanded((state) => !state);
            }
          }}
          className="expand-button"
        >
          <SvgIconHamburgerDotted />
          <span>{title}</span>
        </button>
        {!isUndefined(topExtras) && <div className="extras">{topExtras}</div>}
        {actions && <div className="actions">{actions}</div>}
      </div>
      {children && (controlledOutside ? expanded : localExpanded) ? (
        <div className="expanded-content">{children}</div>
      ) : null}
    </motion.div>
  );
};
