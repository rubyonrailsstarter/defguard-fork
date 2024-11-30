import './style.scss';

import classNames from 'classnames';
import { HTMLMotionProps, motion } from 'framer-motion';
import { useMemo } from 'react';

import SvgAvatar01 from '../../svg/Avatar01';
import SvgAvatar02 from '../../svg/Avatar02';
import SvgAvatar03 from '../../svg/Avatar03';
import SvgAvatar04 from '../../svg/Avatar04';
import SvgAvatar05 from '../../svg/Avatar05';
import SvgAvatar06 from '../../svg/Avatar06';
import SvgAvatar07 from '../../svg/Avatar07';
import SvgAvatar08 from '../../svg/Avatar08';
import SvgAvatar09 from '../../svg/Avatar09';
import SvgAvatar10 from '../../svg/Avatar10';
import SvgAvatar11 from '../../svg/Avatar11';
import SvgAvatar12 from '../../svg/Avatar12';
import { getDeviceAvatar } from './utils/getDeviceAvatar';

interface Props extends HTMLMotionProps<'div'> {
  active?: boolean;
  deviceId?: number;
}

const avatarParts: JSX.Element[] = [
  <SvgAvatar01 key={1} />,
  <SvgAvatar02 key={2} />,
  <SvgAvatar03 key={3} />,
  <SvgAvatar04 key={4} />,
  <SvgAvatar05 key={5} />,
  <SvgAvatar06 key={6} />,
  <SvgAvatar07 key={7} />,
  <SvgAvatar08 key={8} />,
  <SvgAvatar09 key={9} />,
  <SvgAvatar10 key={10} />,
  <SvgAvatar11 key={11} />,
  <SvgAvatar12 key={12} />,
];

/**
 * Displays avatar for user devices.
 */
export const DeviceAvatar = ({ className, deviceId, active = true, ...props }: Props) => {
  const renderAvatar = useMemo(() => {
    if (deviceId) {
      const elements = getDeviceAvatar(deviceId);
      const result: JSX.Element[] = avatarParts.filter((el) => {
        if (!elements.includes(Number(el.key))) {
          return true;
        }
      });
      return result as JSX.Element[];
    }
    return avatarParts;
  }, [deviceId]);

  const cn = classNames(
    'avatar-icon',
    {
      active,
    },
    className,
  );

  return (
    <motion.div {...props} className={cn}>
      {renderAvatar}
    </motion.div>
  );
};
