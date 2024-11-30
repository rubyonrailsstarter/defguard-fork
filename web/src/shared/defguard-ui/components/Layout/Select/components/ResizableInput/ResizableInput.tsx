import { forwardRef, HTMLProps, useEffect, useImperativeHandle, useRef } from 'react';

type Props = HTMLProps<HTMLInputElement>;

type CastdownHandle = {
  focus: () => void;
};

const resizeFactor = 7;

export const ResizableInput = forwardRef<CastdownHandle, Props>((props: Props, ref) => {
  const internalRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      internalRef.current?.focus();
    },
  }));

  useEffect(() => {
    if (internalRef && internalRef.current) {
      const resizableHandler = () => {
        if (internalRef.current) {
          internalRef.current.style.width = `${
            (internalRef.current.value.length + 1) * resizeFactor
          }px`;
        }
      };

      internalRef?.current.addEventListener('change', resizableHandler);
      internalRef?.current.addEventListener('focus', resizableHandler);
      internalRef?.current.addEventListener('blur', resizableHandler);
      internalRef?.current.addEventListener('keyup', resizableHandler);
      internalRef?.current.addEventListener('keypress', resizableHandler);

      return () => {
        if (internalRef.current) {
          internalRef.current?.removeEventListener('change', resizableHandler);
          internalRef.current?.removeEventListener('focus', resizableHandler);
          internalRef.current?.removeEventListener('blur', resizableHandler);
          internalRef.current?.removeEventListener('keyup', resizableHandler);
          // eslint-disable-next-line
          internalRef.current?.removeEventListener('keypress', resizableHandler);
        }
      };
    }
  }, []);

  return <input {...props} ref={internalRef} />;
});
