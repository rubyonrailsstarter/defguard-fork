import './style.scss';

import classNames from 'classnames';
import { HTMLMotionProps, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { debounceTime, Subject } from 'rxjs';

import SvgIconLoupe from '../../svg/IconLoupe';

type Props = {
  containerMotionProps?: HTMLMotionProps<'div'>;
  debounceTiming?: number;
  onDebounce?: (v: string) => void;
  className?: string;
  onChange?: (v: string) => void;
  initialValue?: string;
  placeholder?: string;
};
/**
 * Styled input component that can debounce it's input witch is handy when handling requests depending on user input stream
 */
export const Search = ({
  className,
  containerMotionProps,
  debounceTiming = 1000,
  onDebounce,
  onChange,
  placeholder,
  initialValue = '',
}: Props) => {
  const ref = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState(initialValue);
  const [changeSubject, setChangeSubject] = useState<Subject<string> | undefined>();

  const cn = classNames('search', className);

  useEffect(() => {
    if (changeSubject) {
      const sub = changeSubject.pipe(debounceTime(debounceTiming)).subscribe((value) => {
        if (onDebounce) {
          onDebounce(value);
        }
      });
      return () => sub.unsubscribe();
    } else {
      setChangeSubject(new Subject());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeSubject]);

  return (
    <motion.div
      className={cn}
      onClick={() => ref.current?.focus()}
      {...containerMotionProps}
    >
      <motion.input
        ref={ref}
        placeholder={placeholder}
        value={inputValue}
        initial="idle"
        onChange={(e) => {
          if (onChange) {
            onChange(e.target.value);
          }
          if (onDebounce) {
            changeSubject?.next(e.target.value);
          }
          setInputValue(e.target.value);
        }}
      />
      <SvgIconLoupe />
    </motion.div>
  );
};
