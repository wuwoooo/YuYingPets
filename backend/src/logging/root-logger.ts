import pino from 'pino';

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/** 全局结构化日志（HTTP 访问与异常过滤器共用） */
export const rootLogger = pino({
  level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});
