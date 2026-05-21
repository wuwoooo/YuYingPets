import type { LoggerService, LogLevel } from '@nestjs/common';
import { rootLogger } from './root-logger';

const levelMap: Record<LogLevel, 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'> = {
  fatal: 'fatal',
  error: 'error',
  warn: 'warn',
  log: 'info',
  debug: 'debug',
  verbose: 'trace',
};

export class NestPinoLogger implements LoggerService {
  log(message: unknown, context?: string) {
    this.write('log', message, context);
  }

  fatal(message: unknown, context?: string) {
    this.write('fatal', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    const payload = this.payload(message, context);
    if (trace) {
      payload.trace = trace;
    }
    rootLogger.error(payload);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }

  private write(level: LogLevel, message: unknown, context?: string) {
    rootLogger[levelMap[level]](this.payload(message, context));
  }

  private payload(message: unknown, context?: string): Record<string, unknown> {
    if (message instanceof Error) {
      return {
        context,
        msg: message.message,
        error: {
          name: message.name,
          message: message.message,
          stack: message.stack,
        },
      };
    }

    if (typeof message === 'object' && message !== null) {
      return { context, ...message };
    }

    return { context, msg: String(message) };
  }
}
