import type { Request } from 'express';

function pickFirstForwardedIp(headerValue: string | string[] | undefined) {
  if (!headerValue) return null;
  const raw = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
  const first = raw
    .split(',')
    .map((item) => item.trim())
    .find(Boolean);
  return first || null;
}

export function getRequestClientIp(req: Request) {
  const forwardedFor = pickFirstForwardedIp(req.headers['x-forwarded-for']);
  const clientIp = forwardedFor || req.ip || req.socket.remoteAddress || null;
  return {
    clientIp,
    forwardedFor,
  };
}
