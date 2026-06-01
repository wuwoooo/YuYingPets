import type { ReactNode } from 'react';

export type PresentationGlyphName =
  | 'chart'
  | 'school'
  | 'student'
  | 'fire'
  | 'medal'
  | 'paw'
  | 'trend'
  | 'pie'
  | 'heat'
  | 'award'
  | 'warning'
  | 'check'
  | 'gift'
  | 'summary'
  | 'star'
  | 'bell'
  | 'display'
  | 'logout'
  | 'menu'
  | 'shield'
  | 'gear'
  | 'close'
  | 'sun'
  | 'moon'
  | 'fullscreen'
  | 'fullscreen-exit'
  | 'monitor'
  | 'tablet'
  | 'desktop';

export function PresentationGlyph({ name, className }: { name: PresentationGlyphName; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const icons: Record<string, ReactNode> = {
    chart: (
      <svg {...common}>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20v-11" />
      </svg>
    ),
    school: (
      <svg {...common}>
        <path d="M3 10 12 5l9 5-9 5-9-5Z" />
        <path d="M5 11.5V18h14v-6.5" />
        <path d="M9 18v-4h6v4" />
      </svg>
    ),
    student: (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19c1.8-3 4-4.5 6.5-4.5S16.7 16 18.5 19" />
        <path d="M18.5 7.5 21 9l-2.5 1.5L16 9l2.5-1.5Z" />
      </svg>
    ),
    fire: (
      <svg {...common}>
        <path d="M12 3c1.2 2 1.1 3.6.2 5 2-.6 3.8 1.3 3.8 4 0 2.8-1.8 5-4 5s-4-2.2-4-5c0-1.8.8-3.2 2-4.2.3 1.4 1 2.1 2 2.2C12.7 8 12.8 5.7 12 3Z" />
      </svg>
    ),
    medal: (
      <svg {...common}>
        <path d="M8 3h3l1 4H9L8 3Z" />
        <path d="M13 3h3l-1 4h-3l1-4Z" />
        <circle cx="12" cy="14" r="4.5" />
        <path d="m10.5 14 1 1.1 2-2.2" />
      </svg>
    ),
    paw: (
      <svg {...common}>
        <ellipse cx="8" cy="8" rx="1.6" ry="2.2" />
        <ellipse cx="12" cy="6.8" rx="1.6" ry="2.2" />
        <ellipse cx="16" cy="8" rx="1.6" ry="2.2" />
        <path d="M12 19c-3.2 0-5-1.6-5-3.6 0-1.6 1.3-2.9 2.9-2.9.9 0 1.6.3 2.1.9.5-.6 1.2-.9 2.1-.9 1.6 0 2.9 1.3 2.9 2.9 0 2-1.8 3.6-5 3.6Z" />
      </svg>
    ),
    trend: (
      <svg {...common}>
        <path d="M4 16 9 11l3 3 7-8" />
        <path d="M15 6h4v4" />
      </svg>
    ),
    pie: (
      <svg {...common}>
        <path d="M12 3v9h9" />
        <path d="M20 14a8 8 0 1 1-8-11" />
      </svg>
    ),
    heat: (
      <svg {...common}>
        <rect x="4" y="5" width="4" height="4" rx="1" />
        <rect x="10" y="5" width="4" height="4" rx="1" />
        <rect x="16" y="5" width="4" height="4" rx="1" />
        <rect x="4" y="11" width="4" height="4" rx="1" />
        <rect x="10" y="11" width="4" height="4" rx="1" />
        <rect x="16" y="11" width="4" height="4" rx="1" />
        <rect x="4" y="17" width="4" height="2" rx="1" />
        <rect x="10" y="17" width="4" height="2" rx="1" />
        <rect x="16" y="17" width="4" height="2" rx="1" />
      </svg>
    ),
    award: (
      <svg {...common}>
        <circle cx="12" cy="10" r="4" />
        <path d="M9.5 13.5 8 21l4-2 4 2-1.5-7.5" />
      </svg>
    ),
    warning: (
      <svg {...common}>
        <path d="M12 4 21 20H3L12 4Z" />
        <path d="M12 9v4" />
        <circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.2 2.2 4.8-5" />
      </svg>
    ),
    gift: (
      <svg {...common}>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M12 10v10" />
        <path d="M4 14h16" />
        <path d="M12 10H8.8a2.3 2.3 0 1 1 0-4.6c2.1 0 3.2 2.2 3.2 4.6Z" />
        <path d="M12 10h3.2a2.3 2.3 0 1 0 0-4.6C13.1 5.4 12 7.6 12 10Z" />
      </svg>
    ),
    summary: (
      <svg {...common}>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M8 9h8" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    ),
    star: (
      <svg {...common}>
        <path d="m12 4 2.2 4.5 5 .7-3.6 3.5.9 4.9-4.5-2.4-4.5 2.4.9-4.9L4.8 9.2l5-.7L12 4Z" />
      </svg>
    ),
    bell: (
      <svg {...common}>
        <path d="M6.5 17h11" />
        <path d="M8 17v-5.2a4 4 0 1 1 8 0V17" />
        <path d="M10 20a2.2 2.2 0 0 0 4 0" />
      </svg>
    ),
    display: (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 17v3" />
      </svg>
    ),
    logout: (
      <svg {...common}>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="M14 16l4-4-4-4" />
        <path d="M18 12H9" />
      </svg>
    ),
    menu: (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </svg>
    ),
    shield: (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.4 2.9 8.4 7 10 4.1-1.6 7-5.6 7-10V6l-7-3Z" />
        <path d="m9.5 12 1.7 1.7 3.3-3.7" />
      </svg>
    ),
    gear: (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3.9a7.3 7.3 0 0 0-1.7-1l-.3-2.4h-4l-.3 2.4a7.3 7.3 0 0 0-1.7 1l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7.3 7.3 0 0 0 1.7 1l.3 2.4h4l.3-2.4a7.3 7.3 0 0 0 1.7-1l2.3.9 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
      </svg>
    ),
    close: (
      <svg {...common}>
        <path d="M6 6 18 18" />
        <path d="M18 6 6 18" />
      </svg>
    ),
    sun: (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.2 4.2l1.4 1.4" />
        <path d="M18.4 18.4l1.4 1.4" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M4.2 19.8l1.4-1.4" />
        <path d="M18.4 5.6l1.4-1.4" />
      </svg>
    ),
    moon: (
      <svg {...common}>
        <path d="M18 14.5A7.5 7.5 0 0 1 9.5 6 7.5 7.5 0 1 0 18 14.5Z" />
      </svg>
    ),
    fullscreen: (
      <svg {...common}>
        <path d="M4 9V4h5" />
        <path d="M15 4h5v5" />
        <path d="M20 15v5h-5" />
        <path d="M9 20H4v-5" />
      </svg>
    ),
    monitor: (
      <svg {...common}>
        <rect x="3" y="4.5" width="18" height="12" rx="2" />
        <path d="M9 20h6" />
        <path d="M12 16.5V20" />
      </svg>
    ),
    tablet: (
      <svg {...common}>
        <rect x="6.5" y="3" width="11" height="18" rx="2.2" />
        <path d="M11 5h2" />
        <circle cx="12" cy="18" r=".7" fill="currentColor" stroke="none" />
      </svg>
    ),
    desktop: (
      <svg {...common}>
        <rect x="3" y="4.5" width="18" height="12" rx="2" />
        <path d="M9 20h6" />
        <path d="M12 16.5V20" />
        <path d="M7 8h10" />
        <path d="M7 11h7" />
      </svg>
    ),
    'fullscreen-exit': (
      <svg {...common}>
        <path d="M9 4H4v5" />
        <path d="M20 9V4h-5" />
        <path d="M15 20h5v-5" />
        <path d="M4 15v5h5" />
      </svg>
    ),
  };

  return <span className={className}>{icons[name]}</span>;
}
