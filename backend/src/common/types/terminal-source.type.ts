export const TERMINAL_SOURCES = ['admin', 'display'] as const;

export type TerminalSource = (typeof TERMINAL_SOURCES)[number];
