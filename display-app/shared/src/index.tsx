import { useMemo } from 'react';
import './styles.css';

export function DisplayApp() {
  const displayUrl = useMemo(() => {
    const currentUrl = new URL(window.location.href);
    const forwarded = new URLSearchParams();
    ['terminal', 'displayTerminalCode', 'terminalOverride'].forEach((key) => {
      const value = currentUrl.searchParams.get(key);
      if (value) {
        forwarded.set(key, value);
      }
    });
    const search = forwarded.toString();
    return `/display/display.html${search ? `?${search}` : ''}`;
  }, []);

  return (
    <div className="prototype-shell">
      <iframe
        className="prototype-frame"
        src={displayUrl}
        title="育英星宠 Display 端"
      />
      <div className="prototype-beian">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
          滇ICP备2020007229号-4
        </a>
      </div>
    </div>
  );
}
