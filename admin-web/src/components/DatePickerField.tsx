import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import type { InputHTMLAttributes, MouseEvent } from 'react';
import { DayPicker, type Matcher } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale';
import { formatDisplayDate, formatIsoDate, parseIsoDate } from '../utils/datePicker';

type DatePickerFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  onDismiss?: () => void;
  wrapperClassName?: string;
};

export const DatePickerField = forwardRef<HTMLInputElement, DatePickerFieldProps>(function DatePickerField(
  {
    value,
    onChange,
    onDismiss,
    min,
    max,
    disabled,
    readOnly,
    className,
    wrapperClassName = '',
    placeholder = '选择日期',
    id: idProp,
    name,
    required,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const rootRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  const selected = parseIsoDate(value);
  const minDate = typeof min === 'string' ? parseIsoDate(min) : undefined;
  const maxDate = typeof max === 'string' ? parseIsoDate(max) : undefined;
  const disabledMatchers: Matcher[] = [];
  if (minDate) disabledMatchers.push({ before: minDate });
  if (maxDate) disabledMatchers.push({ after: maxDate });

  const isLocked = Boolean(disabled || readOnly);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: globalThis.MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        onDismiss?.();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        onDismiss?.();
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onDismiss]);

  function closePopover() {
    setOpen(false);
    onDismiss?.();
  }

  function openPopover() {
    if (isLocked) return;
    setOpen(true);
  }

  function handleTriggerClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (isLocked) return;
    setOpen((previous) => {
      const next = !previous;
      if (!next) onDismiss?.();
      return next;
    });
  }

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onChange(formatIsoDate(date));
    closePopover();
  }

  const displayValue = formatDisplayDate(value);

  return (
    <span ref={rootRef} className={`date-picker-field ${wrapperClassName}`.trim()}>
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="text"
        readOnly
        className={className}
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel ?? '选择日期'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openPopover}
        onFocus={openPopover}
      />
      <button
        aria-label="打开日期选择器"
        className="date-picker-trigger"
        disabled={isLocked}
        onMouseDown={handleTriggerClick}
        tabIndex={-1}
        type="button"
      >
        <span className="date-picker-trigger-caret" aria-hidden="true" />
      </button>
      {open ? (
        <div className="date-picker-popover" role="dialog" aria-label="日期选择器">
          <DayPicker
            mode="single"
            locale={zhCN}
            selected={selected}
            onSelect={handleSelect}
            disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
            defaultMonth={selected ?? maxDate ?? minDate ?? new Date()}
          />
        </div>
      ) : null}
    </span>
  );
});
