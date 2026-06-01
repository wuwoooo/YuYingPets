import 'express';
import type { AuthUser } from '@/common/auth/auth-user.interface';

declare module 'express-serve-static-core' {
  interface Request {
    /** 请求追踪 ID（中间件写入，响应头 X-Request-Id 同步返回） */
    requestId?: string;
    /** 全局 JWT Guard 解析出的当前用户 */
    user?: AuthUser;
  }
}
