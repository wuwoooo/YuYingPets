import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { httpLogPath } from '@/common/utils/redact-audit-detail';
import { rootLogger } from '@/logging/root-logger';

const accessLogger = rootLogger.child({ context: 'http_access' });

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const started = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Date.now() - started;
        const payload = {
          msg: 'request_completed',
          requestId: req.requestId,
          method: req.method,
          path: httpLogPath(req.originalUrl ?? req.url),
          statusCode: res.statusCode,
          durationMs,
        };
        if (res.statusCode >= 500) {
          accessLogger.error(payload);
          return;
        }
        if (res.statusCode >= 400) {
          accessLogger.warn(payload);
          return;
        }
        accessLogger.info(payload);
      }),
    );
  }
}
