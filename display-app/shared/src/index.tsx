import { useMemo } from 'react';
import './styles.css';

export function DisplayApp() {
  const prototypeUrl = useMemo(() => {
    const currentUrl = new URL(window.location.href);
    const forwarded = new URLSearchParams();
    ['terminal', 'displayTerminalCode', 'terminalOverride'].forEach((key) => {
      const value = currentUrl.searchParams.get(key);
      if (value) {
        forwarded.set(key, value);
      }
    });
    const search = forwarded.toString();
    return `/prototype/display.html${search ? `?${search}` : ''}`;
  }, []);

  return (
    <div className="prototype-shell">
      <iframe
        className="prototype-frame"
        src={prototypeUrl}
        title="育英星宠 Display 原型"
      />
    </div>
  );
}
