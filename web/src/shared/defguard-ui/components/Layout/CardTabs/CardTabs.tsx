import './style.scss';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import { ArrowSingle } from '../../icons/ArrowSingle/ArrowSingle';
import { ArrowSingleDirection, ArrowSingleSize } from '../../icons/ArrowSingle/types';
import { CardTab } from './components/CardTab';
import { CardTabsData } from './types';

type Props = {
  tabs: CardTabsData[];
  onCreate?: () => void;
  createContent?: ReactNode | string;
  loading?: boolean;
};

export const CardTabs = ({ tabs, onCreate, createContent, loading = false }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollControlls, setShowScrollControlls] = useState(false);

  const checkOverflow = useCallback(() => {
    if (containerRef.current) {
      return containerRef.current.scrollWidth > containerRef.current.offsetWidth;
    }
    return false;
  }, []);

  // check overflow on component mount
  useEffect(() => {
    setTimeout(() => {
      if (checkOverflow()) {
        setShowScrollControlls(true);
      } else {
        if (showScrollControlls) {
          setShowScrollControlls(false);
        }
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, containerRef.current]);

  if (loading) {
    return (
      <div className="card-tabs">
        <div className="tabs-container">
          <Skeleton containerClassName="network-tab-skeleton" />
          <Skeleton containerClassName="network-tab-skeleton" />
          <Skeleton containerClassName="network-tab-skeleton" />
        </div>
      </div>
    );
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollBy = containerRef.current.offsetWidth * 0.25;
      if (direction === 'left') {
        containerRef.current.scrollBy({
          left: scrollBy * -1,
          behavior: 'smooth',
        });
      } else {
        containerRef.current.scrollBy({
          left: scrollBy,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <div className="card-tabs">
      <div className="tabs-container" ref={containerRef}>
        {tabs.map(({ key, ...rest }) => (
          <CardTab {...rest} key={key} />
        ))}
        {onCreate && createContent && (
          <CardTab onClick={() => onCreate()} content={createContent} />
        )}
      </div>
      {showScrollControlls && (
        <div className="scroll-controls">
          <button onClick={() => handleScroll('left')}>
            <ArrowSingle
              direction={ArrowSingleDirection.LEFT}
              size={ArrowSingleSize.LARGE}
            />
          </button>
          <button onClick={() => handleScroll('right')}>
            <ArrowSingle
              direction={ArrowSingleDirection.RIGHT}
              size={ArrowSingleSize.LARGE}
            />
          </button>
        </div>
      )}
    </div>
  );
};
