import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthService } from '@/modules/auth/auth.service';

const PROJECTION_ALLOWED_GET_PATHS = [
  '/auth/me',
  '/classes',
  '/students',
  '/score-rules',
  '/score-records',
  '/honors',
  '/honor-records',
  '/rewards',
  '/academic-records',
  '/academic-records/exams',
  '/display/terminals',
  '/display/weather',
  '/admin/settings/display',
  '/admin/analytics/summary',
  '/admin/analytics/heatmap',
];

function normalizeApiPath(path: string) {
  return path.replace(/^\/api\/v\d+(?=\/)/, '');
}

function isProjectionRequestAllowed(method: string, path: string) {
  if (method !== 'GET') return false;
  const normalizedPath = normalizeApiPath(path);
  return PROJECTION_ALLOWED_GET_PATHS.includes(normalizedPath);
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    request.user = await this.authService.getAuthUserFromAuthorization(
      request.headers.authorization,
    );
    if (
      request.user.terminalType === 'projection' &&
      !isProjectionRequestAllowed(request.method, request.path)
    ) {
      throw new ForbiddenException('投屏访问仅允许读取投屏所需数据');
    }
    if (request.user.passwordChangeRequired && !request.path.endsWith('/auth/change-password')) {
      throw new ForbiddenException('当前账号使用临时密码，必须先修改密码');
    }
    return true;
  }
}
