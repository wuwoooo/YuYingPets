import { useEffect, useRef, useState, type ReactNode } from 'react';

type EllipsisTipProps = {
  /** 完整文案，用于检测截断与悬浮提示 */
  text: string;
  className?: string;
  /** 多行截断时使用 */
  multiline?: boolean;
  children?: ReactNode;
};

/** 文本溢出时在 hover 展示完整内容 */
export function EllipsisTip({
  text,
  className = '',
  multiline = false,
  children,
}: EllipsisTipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const truncated =
        el.scrollWidth > el.clientWidth + 1 ||
        el.scrollHeight > el.clientHeight + 1;
      setTip(truncated ? text : null);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    window.addEventListener('resize', sync);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [text]);

  return (
    <span
      className={`ellipsis-tip-root${className ? ` ${className}` : ''}`}
      data-tip={tip ?? undefined}
      aria-label={tip ?? undefined}
    >
      <span
        ref={ref}
        className={`ellipsis-tip${multiline ? ' ellipsis-tip--multiline' : ''}`}
      >
        {children ?? text}
      </span>
    </span>
  );
}
