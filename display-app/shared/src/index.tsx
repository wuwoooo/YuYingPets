import { useEffect, useMemo } from 'react';
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
    const displayPage = new URL('/display/display.html', currentUrl.origin);
    displayPage.search = search;
    return displayPage.toString();
  }, []);

  useEffect(() => {
    window.location.replace(displayUrl);
  }, [displayUrl]);

  return (
    <main className="prototype-redirect">
      <a href={displayUrl}>进入育英星宠 Display 端</a>
    </main>
  );
}
