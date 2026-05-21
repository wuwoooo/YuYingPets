/** 匹配业务审计 JSON 中需脱敏的字段名（大小写不敏感） */
const SENSITIVE_KEY_RE =
  /password|passwd|pwd|token|secret|authorization|apikey|api_key|credential|refresh|cookie/i;

/**
 * 递归脱敏写入 operation_log.detail 的对象，避免明文口令、令牌进入数据库。
 */
export function sanitizeAuditDetail(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditDetail(item));
  }
  if (typeof value !== 'object') {
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      out[key] = '[已脱敏]';
    } else if (typeof child === 'object' && child !== null) {
      out[key] = sanitizeAuditDetail(child);
    } else {
      out[key] = child;
    }
  }
  return out;
}

/** 访问日志路径：去掉 query，降低敏感参数泄漏风险 */
export function httpLogPath(originalUrl: string): string {
  const q = originalUrl.indexOf('?');
  return q === -1 ? originalUrl : originalUrl.slice(0, q);
}
