import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes, MouseEvent } from 'react';
import { DayPicker, type Matcher } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale';
import {
  combineDateTimeLocal,
  DEFAULT_DATE_TIME,
  formatDisplayDateTime,
  formatIsoDate,
  parseDateTimeLocal,
  parseIsoDate,
} from '../utils/datePicker';

type DateTimePickerFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  onDismiss?: () => void;
  wrapperClassName?: string;
};

export const DateTimePickerField = forwardRef<HTMLInputElement, DateTimePickerFieldProps>(function DateTimePickerField(
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
    placeholder = '选择日期与时间',
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
  const parsedValue = parseDateTimeLocal(value);
  const [draftDate, setDraftDate] = useState(parsedValue?.date ?? '');
  const [draftTime, setDraftTime] = useState(parsedValue?.time ?? DEFAULT_DATE_TIME);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  useEffect(() => {
    const next = parseDateTimeLocal(value);
    setDraftDate(next?.date ?? '');
    setDraftTime(next?.time ?? DEFAULT_DATE_TIME);
  }, [value]);

  const selected = parseIsoDate(draftDate || parsedValue?.date);
  const minDate = typeof min === 'string' ? parseIsoDate(min.slice(0, 10)) : undefined;
  const maxDate = typeof max === 'string' ? parseIsoDate(max.slice(0, 10)) : undefined;
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

  function commit(date: string, time: string) {
    if (!date || !time) return;
    onChange(combineDateTimeLocal(date, time));
  }

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const nextDate = formatIsoDate(date);
    const nextTime = draftTime || DEFAULT_DATE_TIME;
    setDraftDate(nextDate);
    commit(nextDate, nextTime);
  }

  function handleTimeChange(event: ChangeEvent<HTMLInputElement>) {
    const nextTime = event.target.value;
    setDraftTime(nextTime);
    if (draftDate) {
      commit(draftDate, nextTime);
    }
  }

  function handleClear() {
    setDraftDate('');
    setDraftTime(DEFAULT_DATE_TIME);
    onChange('');
    closePopover();
  }

  const displayValue = formatDisplayDateTime(value);

  return (
    <span ref={rootRef} className={`date-picker-field date-time-picker-field ${wrapperClassName}`.trim()}>
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
        aria-label={ariaLabel ?? '选择日期与时间'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openPopover}
        onFocus={openPopover}
      />
      <button
        aria-label="打开日期时间选择器"
        className="date-picker-trigger"
        disabled={isLocked}
        onMouseDown={handleTriggerClick}
        tabIndex={-1}
        type="button"
      >
        <span className="date-picker-trigger-caret" aria-hidden="true" />
      </button>
      {open ? (
        <div className="date-picker-popover date-time-picker-popover" role="dialog" aria-label="日期时间选择器">
          <DayPicker
            mode="single"
            locale={zhCN}
            selected={selected}
            onSelect={handleSelect}
            disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
            defaultMonth={selected ?? maxDate ?? minDate ?? new Date()}
          />
          <div className="date-time-picker-time-row">
            <span className="date-time-picker-time-label">时间</span>
            <input
              className="date-time-picker-time-input"
              type="time"
              step={60}
              value={draftTime}
              onChange={handleTimeChange}
            />
          </div>
          <div className="date-time-picker-actions">
            <button className="date-time-picker-clear" type="button" onClick={handleClear}>
              清空
            </button>
            <button className="date-time-picker-done" type="button" onClick={closePopover}>
              完成
            </button>
          </div>
        </div>
      ) : null}
    </span>
  );
});
