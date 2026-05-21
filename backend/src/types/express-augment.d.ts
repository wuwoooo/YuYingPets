import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    /** 请求追踪 ID（中间件写入，响应头 X-Request-Id 同步返回） */
    requestId?: string;
  }
}
