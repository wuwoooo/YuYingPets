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
import { getRequestClientIp } from '@/logging/request-client-ip';

const errLogger = rootLogger.child({ context: 'http_exception' });

function extractExceptionMessage(exception: unknown, body: Record<string, unknown>) {
  if (exception instanceof Error && exception.message) {
    return exception.message;
  }
  const message = body.message;
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  return '';
}

function isMissingAuthorization(status: number, message: string) {
  return status === HttpStatus.UNAUTHORIZED && message === '缺少 Authorization';
}

function buildErrorLogDetail(exception: unknown, status: number) {
  if (!(exception instanceof Error)) {
    return { message: String(exception) };
  }

  if (status >= 500) {
    return { name: exception.name, message: exception.message, stack: exception.stack };
  }

  return { name: exception.name, message: exception.message };
}

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

    const exceptionMessage = extractExceptionMessage(exception, body);
    const { clientIp, forwardedFor } = getRequestClientIp(request);
    const logPayload = {
      msg: 'request_failed',
      requestId: request.requestId,
      method: request.method,
      path: httpLogPath(request.originalUrl ?? request.url),
      statusCode: status,
      clientIp,
      forwardedFor,
      error: buildErrorLogDetail(exception, status),
    };

    if (isMissingAuthorization(status, exceptionMessage)) {
      // 未携带 token 的 401 属于预期行为（如 display 未登录预览），避免污染 warn/error 日志
      errLogger.debug({
        msg: logPayload.msg,
        requestId: logPayload.requestId,
        method: logPayload.method,
        path: logPayload.path,
        statusCode: logPayload.statusCode,
        error: { name: logPayload.error.name, message: logPayload.error.message },
      });
    } else if (status >= 500) {
      errLogger.error(logPayload);
    } else {
      errLogger.warn(logPayload);
    }

    response.status(status).json(body);
  }
}
