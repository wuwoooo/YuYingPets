import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { httpLogPath } from '@/common/utils/redact-audit-detail';
import { rootLogger } from '@/logging/root-logger';

const errLogger = rootLogger.child({ context: 'http_exception' });

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      errLogger.error({
        msg: 'non_http_context_exception',
        contextType: host.getType(),
        error:
          exception instanceof Error
            ? { name: exception.name, message: exception.message }
            : String(exception),
      });
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionBody = exception instanceof HttpException ? exception.getResponse() : undefined;
    const body =
      typeof exceptionBody === 'string'
        ? { statusCode: status, message: exceptionBody }
        : ((exceptionBody ?? { statusCode: status, message: 'Internal Server Error' }) as Record<
            string,
            unknown
          >);

    const logPayload = {
      msg: 'request_failed',
      requestId: request.requestId,
      method: request.method,
      path: httpLogPath(request.originalUrl ?? request.url),
      statusCode: status,
      error:
        exception instanceof Error
          ? { name: exception.name, message: exception.message, stack: exception.stack }
          : { message: String(exception) },
    };

    if (status >= 500) {
      errLogger.error(logPayload);
    } else {
      errLogger.warn(logPayload);
    }

    response.status(status).json(body);
  }
}
