import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes, MouseEvent } from 'react';

type PickerInputType = 'date' | 'time' | 'month' | 'week' | 'datetime-local';

type PickerInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type: PickerInputType;
  wrapperClassName?: string;
};

type PickerCapableInput = HTMLInputElement & {
  showPicker?: () => void;
};

export const PickerInput = forwardRef<HTMLInputElement, PickerInputProps>(function PickerInput(
  { className, wrapperClassName = '', disabled, readOnly, type, ...props },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeSelectionStepRef = useRef(0);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  const openPicker = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (disabled || readOnly) {
      return;
    }

    const input = inputRef.current as PickerCapableInput | null;
    if (!input) {
      return;
    }

    if (type === 'time') {
      timeSelectionStepRef.current = 0;
    }

    input.focus();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    props.onChange?.(event);
    if (type === 'time') {
      if (timeSelectionStepRef.current === 0) {
        timeSelectionStepRef.current = 1;
        return;
      }
      timeSelectionStepRef.current = 0;
      requestAnimationFrame(() => {
        inputRef.current?.blur();
      });
    }
  };

  return (
    <span className={`picker-input ${wrapperClassName}`.trim()}>
      <input
        {...props}
        ref={inputRef}
        className={className}
        disabled={disabled}
        readOnly={readOnly}
        type={type}
        onChange={handleChange}
      />
      <button
        aria-label="打开选择器"
        className="picker-input-trigger"
        disabled={disabled}
        onMouseDown={openPicker}
        tabIndex={-1}
        type="button"
      >
        <span className="picker-input-trigger-caret" aria-hidden="true" />
      </button>
    </span>
  );
});
