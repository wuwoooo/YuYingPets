import { mkdirSync } from 'node:fs';
import path from 'node:path';
import pino from 'pino';

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const logDir = path.resolve(__dirname, '../../logs');

mkdirSync(logDir, { recursive: true });

const appLogDestination = pino.destination({
  dest: path.join(logDir, 'app.log'),
  mkdir: true,
  sync: false,
});

const errorLogDestination = pino.destination({
  dest: path.join(logDir, 'error.log'),
  mkdir: true,
  sync: false,
});

/** 全局结构化日志（HTTP 访问与异常过滤器共用） */
export const rootLogger = pino({
  level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.multistream([
  { stream: process.stdout },
  { stream: appLogDestination },
  { level: 'error', stream: errorLogDestination },
]));
