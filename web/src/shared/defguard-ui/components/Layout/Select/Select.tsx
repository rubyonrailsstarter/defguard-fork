import './style.scss';

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from '@floating-ui/react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { isUndefined } from 'lodash-es';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { debounceTime, Subject } from 'rxjs';
import { useBreakpoint } from 'use-breakpoint';

import { deviceBreakpoints } from '../../../../constants';
import { detectClickInside } from '../../../utils/detectClickOutside';
import { isComparableWithStrictEquality } from '../../../utils/isComparable';
import { ArrowSingle } from '../../icons/ArrowSingle/ArrowSingle';
import { ArrowSingleDirection, ArrowSingleSize } from '../../icons/ArrowSingle/types';
import { LoaderSpinner } from '../LoaderSpinner/LoaderSpinner';
import { Tag } from '../Tag/Tag';
import { ResizableInput } from './components/ResizableInput/ResizableInput';
import { SelectOptionRow } from './components/SelectOptionRow/SelectOptionRow';
import {
  SelectFloatingOption,
  SelectOption,
  SelectProps,
  SelectSizeVariant,
} from './types';

const compare = <T,>(v: T, other: T): boolean => {
  if (!isComparableWithStrictEquality(v)) {
    throw Error('Value is not comparable, make sure you provided identify method !');
  }

  return v === other;
};

export const Select = <T,>({
  onChangeArray,
  identify,
  onChangeSingle,
  onSearch,
  searchFilter,
  onRemove,
  onCreate,
  options,
  placeholder,
  selected,
  label,
  labelExtras,
  invalid,
  errorMessage,
  addOptionLabel,
  renderSelected,
  searchable = false,
  loading = false,
  disabled = false,
  searchDebounce = 500,
  searchMinLength = 1,
  disableLabelColon = false,
  inForm = false,
  disableOpen = false,
  sizeVariant = SelectSizeVariant.STANDARD,
  disposable = true,
  'data-testid': testId,
}: SelectProps<T>) => {
  const { breakpoint } = useBreakpoint(deviceBreakpoints);
  const selectId = useId();
  const [open, setOpen] = useState(false);
  // used value for filtering options
  const [searchValue, setSearchValue] = useState<string | undefined>();
  // only for display
  const [searchDisplayValue, setSearchDisplayValue] = useState<string>('');
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSubject] = useState<Subject<string | undefined>>(new Subject());
  const extendable = useMemo(() => !isUndefined(onCreate), [onCreate]);

  const multi = Array.isArray(selected);

  const identifiers = useMemo(() => {
    if (Array.isArray(selected) && !isUndefined(identify)) {
      return selected.map((v) => identify(v));
    }
    return [];
  }, [identify, selected]);

  const { x, y, strategy, refs } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom',
    middleware: [
      offset(5),
      flip(),
      size({
        apply: ({ rects, elements }) => {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: (refElement, floatingElement, updateFunc) =>
      autoUpdate(refElement, floatingElement, updateFunc),
  });

  const handleSelect = useCallback(
    (value: T): void => {
      if (Array.isArray(selected)) {
        if (!onChangeArray) {
          throw Error('onChangeArray was not supplied when selected is an array');
        }
        if (selected.length) {
          if (isComparableWithStrictEquality(value) && !identify) {
            const includes = selected.includes(value);
            if (includes) {
              onChangeArray(selected.filter((v) => v !== value));
            } else {
              onChangeArray([...selected, value]);
            }
          } else {
            if (!identify) {
              throw Error('Select component needs identify method for comparing Objects');
            }
            const includes = selected
              .map((v) => identify(v))
              .find((v) => v === identify(value));
            if (includes) {
              onChangeArray(selected.filter((v) => identify(v) !== identify(value)));
            } else {
              onChangeArray([...selected, value]);
            }
          }
        } else {
          onChangeArray?.([value]);
        }
      } else {
        setOpen(false);
        if (!onChangeSingle) {
          throw Error(
            'onChangeSingle was not supplied when selected value was not an array',
          );
        }
        onChangeSingle(value);
      }
      if (searchable) {
        // reset search
        onSearch?.('');
        setSearchValue('');
        setSearchDisplayValue('');
      }
    },
    [selected, searchable, onChangeArray, identify, onChangeSingle, onSearch],
  );

  const getClassName = useMemo(() => {
    return classNames(
      'select-container',
      {
        disabled,
        loading,
        open,
        multi,
        selected: Array.isArray(selected)
          ? selected && selected.length
          : !isUndefined(selected),
        'in-form': inForm,
      },
      `size-${sizeVariant.valueOf().toLocaleLowerCase()}`,
    );
  }, [disabled, inForm, loading, multi, open, selected, sizeVariant]);

  const showSelectInnerPlaceholder = useMemo(() => {
    if (Array.isArray(selected)) {
      if (selected.length) {
        return false;
      }
    } else {
      if (selected) {
        return false;
      }
    }
    if (searchValue) {
      return false;
    }
    return true;
  }, [searchValue, selected]);

  const renderTags = useMemo(() => {
    if (isUndefined(selected) && !Array.isArray(selected) && !multi) {
      return null;
    }

    if (Array.isArray(selected) && selected.length) {
      if (isUndefined(renderSelected)) {
        throw Error(
          'renderSelected prop cannot be undefined if selected value is an Array.',
        );
      }

      return selected.map((val) => {
        const data = renderSelected(val);
        return (
          <Tag
            key={data.key}
            text={data.displayValue}
            disposable={disposable}
            onDispose={() => {
              if (onRemove) {
                onRemove(val);
              }
              handleSelect(val);
            }}
          />
        );
      });
    }

    return null;
  }, [multi, onRemove, selected, renderSelected, handleSelect, disposable]);

  const renderInner = useMemo(() => {
    if (searchFocused) return null;

    // render placeholder when selected is undefined
    if (isUndefined(selected) && !isUndefined(placeholder)) {
      return <span className="placeholder">{placeholder}</span>;
    }

    // render selected value for single mode
    if (!isUndefined(selected) && !Array.isArray(selected)) {
      const displayValue = renderSelected(selected).displayValue;
      return <span className="placeholder">{displayValue}</span>;
    }

    return null;
  }, [placeholder, searchFocused, selected, renderSelected]);

  // options in float are only for presentation
  const floatingOptions = useMemo((): SelectFloatingOption<T>[] => {
    let availableOptions: SelectOption<T>[] = options;

    if (searchable && searchValue && searchValue.length) {
      if (!searchFilter) {
        throw Error('Select needs to be suplied with searchFilter when searchable');
      }
      availableOptions = searchFilter(searchValue, options);
    }

    if (isUndefined(selected)) {
      return availableOptions.map((o) => ({ ...o, selected: false }));
    }

    return availableOptions.map((o) => {
      if (Array.isArray(selected)) {
        const isComparable = isComparableWithStrictEquality(o.value);

        if (isComparable && !identify) {
          return { ...o, selected: selected.includes(o.value) };
        } else {
          if (!identify) {
            throw Error('Select component needs identify method for comparing Objects');
          }
          return {
            ...o,
            selected: identifiers?.includes(identify(o.value)) ?? false,
          };
        }
      } else {
        if (isComparableWithStrictEquality(o.value)) {
          return { ...o, selected: compare(o.value, selected) };
        } else {
          if (!identify) {
            throw Error(
              'Select needs to be suplied with identify method when values are objects',
            );
          }

          return { ...o, selected: identify(o.value) === identify(selected) };
        }
      }
    });
  }, [identifiers, identify, options, searchFilter, searchValue, searchable, selected]);

  const focusSearch = () => {
    if (searchable && searchRef && !searchFocused) {
      searchRef.current?.focus();
    }
  };

  // search sub
  useEffect(() => {
    const sub = searchSubject
      .pipe(debounceTime(searchDebounce))
      .subscribe((searchValue) => {
        if (onSearch) {
          onSearch(searchValue);
        }
        setSearchValue(searchValue);
      });
    return () => sub.unsubscribe();
  }, [onSearch, searchDebounce, searchMinLength, searchSubject]);

  // check click outside
  useEffect(() => {
    const clickHandler = (env: MouseEvent) => {
      const selectRect = refs.reference.current?.getBoundingClientRect();
      const floatingRect = refs.floating.current?.getBoundingClientRect();
      if (selectRect) {
        const rects = [selectRect as DOMRect];
        if (floatingRect) {
          rects.push(floatingRect);
        }
        const clickedInside = detectClickInside(env, rects);
        if (!clickedInside) {
          setOpen(false);
        }
      }
    };
    document.addEventListener('click', clickHandler);
    return () => {
      document.removeEventListener('click', clickHandler);
    };
  }, [refs.floating, refs.reference]);

  return (
    <div className="select" data-testid={testId}>
      {(!isUndefined(label) || !isUndefined(labelExtras)) && (
        <div className="top">
          {!isUndefined(label) && (
            <label className="select-label" htmlFor={selectId}>
              {label}
              {!disableLabelColon && ':'}
            </label>
          )}
          {!isUndefined(labelExtras) && labelExtras}
        </div>
      )}
      <motion.div
        ref={refs.setReference}
        id={selectId}
        className={getClassName}
        onClick={() => {
          if (open) {
            if (searchable) {
              focusSearch();
            }
          } else {
            if (!disabled && !loading && !disableOpen) {
              setOpen(true);
              if (searchable) {
                focusSearch();
              }
            }
          }
        }}
      >
        <div className="inner-frame">
          {renderInner}
          <div className="content-frame">
            {renderTags}
            {searchable && (
              <ResizableInput
                type="text"
                className="select-search"
                value={searchDisplayValue}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const searchValue = event.target.value;
                  setSearchDisplayValue(searchValue);
                  searchSubject.next(searchValue);
                }}
                ref={searchRef}
                placeholder={showSelectInnerPlaceholder ? placeholder : undefined}
              />
            )}
          </div>
          <div className="side">
            {loading ? (
              <LoaderSpinner
                size={sizeVariant === SelectSizeVariant.STANDARD ? 22 : 18}
              />
            ) : (
              <ArrowSingle
                size={ArrowSingleSize.LARGE}
                direction={ArrowSingleDirection.DOWN}
              />
            )}
          </div>
        </div>
        <AnimatePresence mode="wait">
          {invalid && !open && errorMessage ? (
            <motion.span
              className="error-message"
              initial={{
                x: 20,
                opacity: 0,
                bottom: 0,
              }}
              animate={{
                x: 20,
                opacity: 1,
                bottom: -20,
              }}
              exit={{
                opacity: 0,
                x: 20,
                bottom: -20,
              }}
            >
              {errorMessage}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.div>
      <FloatingPortal>
        <AnimatePresence mode="wait">
          {open && options && (floatingOptions.length > 0 || extendable) && (
            <motion.div
              className="select-floating-ui"
              ref={refs.setFloating}
              style={{
                position: strategy,
                left: x || 0,
                top: y || 0,
              }}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.1,
              }}
            >
              <div className="options-container">
                {extendable && breakpoint !== 'desktop' && (
                  <SelectOptionRow
                    label={addOptionLabel}
                    createOption
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCreate?.();
                      setOpen(false);
                    }}
                  />
                )}
                {floatingOptions?.map((option) => {
                  return (
                    <SelectOptionRow
                      key={option.key}
                      label={option.label}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(option.value);
                        if (searchable) {
                          focusSearch();
                        }
                      }}
                      selected={option.selected}
                    />
                  );
                })}
                {extendable && breakpoint === 'desktop' && (
                  <SelectOptionRow
                    label={addOptionLabel}
                    createOption
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCreate?.();
                      setOpen(false);
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </div>
  );
};
