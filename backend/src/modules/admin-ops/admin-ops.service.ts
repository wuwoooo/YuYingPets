import { ForbiddenException, Injectable } from '@nestjs/common';
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readSync, statfsSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AuthService } from '@/modules/auth/auth.service';
import { HealthService } from '@/modules/health/health.service';
import { AdminOpsLogsQueryDto } from './admin-ops.dto';

type AdminOpsLogLevel = 'info' | 'warn' | 'error' | 'fatal' | 'unknown';

type ParsedLogRow = {
  id: string;
  time: string | null;
  level: AdminOpsLogLevel;
  source: string;
  summary: string;
  requestId: string | null;
  raw: string;
  detail: Record<string, unknown> | null;
};

@Injectable()
export class AdminOpsService {
  private readonly appName = process.env.PM2_APP_NAME || 'yuyingpets-backend';
  private readonly cwd = path.resolve(__dirname, '../../..');
  private readonly pm2Home = process.env.PM2_HOME || path.join(process.env.HOME || '', '.pm2');
  private readonly maxLogReadBytes = Number(process.env.ADMIN_OPS_LOG_READ_BYTES || 2 * 1024 * 1024);

  constructor(
    private readonly authService: AuthService,
    private readonly healthService: HealthService,
  ) {}

  private ensureCanViewOps(roleCode: string) {
    if (!['super_admin', 'school_admin', 'academic_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权查看运行监控');
    }
  }

  private getLogCandidates() {
    return {
      error: [
        process.env.LOG_REPORT_ERROR_LOG,
        path.join(this.cwd, 'logs/error.log'),
        path.join(this.pm2Home, 'logs', `${this.appName}-error.log`),
      ].filter(Boolean) as string[],
      out: [
        path.join(this.cwd, 'logs/app.log'),
        process.env.LOG_REPORT_OUT_LOG,
        path.join(this.cwd, 'logs/out.log'),
        path.join(this.pm2Home, 'logs', `${this.appName}-out.log`),
      ].filter(Boolean) as string[],
    };
  }

  private firstExisting(paths: string[]) {
    return paths.find((item) => existsSync(item)) ?? null;
  }

  private parseLogLevel(payload: Record<string, unknown>, rawLine: string): AdminOpsLogLevel {
    const numeric = typeof payload.level === 'number' ? payload.level : null;
    if (numeric === 60) return 'fatal';
    if (numeric === 50) return 'error';
    if (numeric === 40) return 'warn';
    if (numeric === 30) return 'info';
    if (typeof payload.level === 'string') {
      const level = payload.level.toLowerCase();
      if (level === 'fatal' || level === 'error' || level === 'warn' || level === 'info') return level;
    }

    const lower = rawLine.toLowerCase();
    if (lower.includes('fatal')) return 'fatal';
    if (lower.includes('error') || lower.includes('exception')) return 'error';
    if (lower.includes('warn')) return 'warn';
    return 'unknown';
  }

  private parseJsonLine(line: string) {
    const start = line.indexOf('{');
    if (start < 0) return null;
    try {
      return JSON.parse(line.slice(start)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private summarizeKnownError(msg: string, payload: Record<string, unknown>, line: string) {
    if (msg === 'unhandled_rejection') return '出现未处理 Promise 拒绝，请检查最近一次异步调用失败。';
    if (msg === 'uncaught_exception') return '出现未捕获异常，服务可能已退出或将由 PM2 拉起。';
    if (msg === 'bootstrap_failed') return '后端启动失败，请优先检查环境变量、数据库连接或 Prisma 初始化。';
    if (msg === 'healthcheck_degraded') return '健康检查降级，数据库依赖当前不可用。';
    if (msg === 'request_failed') return '接口请求失败，已进入异常处理流程。';
    if (msg === 'request_completed' && typeof payload.statusCode === 'number' && payload.statusCode >= 500) {
      return `接口 ${String(payload.method ?? 'GET')} ${String(payload.path ?? '')} 返回 ${payload.statusCode}。`;
    }
    if (line.includes('PrismaClientKnownRequestError') || line.includes('Prisma')) {
      return '检测到 Prisma 相关错误，请排查数据库结构、约束或连接状态。';
    }
    if (line.includes('ECONNREFUSED')) return '检测到连接被拒绝，请检查依赖服务是否在线。';
    if (line.includes('ETIMEDOUT')) return '检测到请求超时，请检查网络或数据库响应。';
    return '';
  }

  private buildLogSummary(payload: Record<string, unknown> | null, line: string, source: string) {
    if (!payload) {
      const raw = line.trim();
      if (!raw) return `${source} 输出了一条空白日志`;
      const known = this.summarizeKnownError('', {}, raw);
      return known || raw.slice(0, 140);
    }

    const msg = typeof payload.msg === 'string' ? payload.msg : '';
    const context = typeof payload.context === 'string' ? payload.context : source;
    const known = this.summarizeKnownError(msg, payload, line);
    if (known) return known;

    if (msg) return `${context}：${msg}`;
    if (typeof payload.error === 'object' && payload.error) {
      const errorRecord = payload.error as Record<string, unknown>;
      if (typeof errorRecord.message === 'string' && errorRecord.message.trim()) {
        return `${context}：${errorRecord.message}`;
      }
    }
    return `${source} 记录了一条 ${context} 日志`;
  }

  private extractRequestId(payload: Record<string, unknown> | null) {
    if (!payload) return null;
    return typeof payload.requestId === 'string' && payload.requestId.trim() ? payload.requestId : null;
  }

  private extractTime(payload: Record<string, unknown> | null, raw: string) {
    if (payload && typeof payload.time === 'string' && payload.time.trim()) {
      return payload.time;
    }
    const match = raw.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/);
    return match?.[0] ?? null;
  }

  private isNoisyAccessLog(payload: Record<string, unknown> | null) {
    return payload?.msg === 'request_completed' && payload?.context === 'http_access' && payload?.statusCode === 200;
  }

  private readLogTail(file: string) {
    const stats = statSync(file);
    if (!stats.isFile() || stats.size <= 0) return '';

    const maxBytes = Number.isFinite(this.maxLogReadBytes) && this.maxLogReadBytes > 0 ? this.maxLogReadBytes : 2 * 1024 * 1024;
    const length = Math.min(stats.size, maxBytes);
    const start = Math.max(0, stats.size - length);
    const buffer = Buffer.alloc(length);
    const fd = openSync(file, 'r');

    try {
      const bytesRead = readSync(fd, buffer, 0, length, start);
      let content = buffer.subarray(0, bytesRead).toString('utf8');
      if (start > 0) {
        const firstNewline = content.indexOf('\n');
        content = firstNewline >= 0 ? content.slice(firstNewline + 1) : '';
      }
      return content;
    } finally {
      closeSync(fd);
    }
  }

  private parseRows(file: string | null, source: string) {
    if (!file) return [] as ParsedLogRow[];

    const content = this.readLogTail(file);
    const rows = content.split(/\r?\n/).filter(Boolean);
    return rows.map((line, index) => {
      const payload = this.parseJsonLine(line);
      return {
        id: `${source}-${index}-${Buffer.from(line).toString('base64').slice(0, 12)}`,
        time: this.extractTime(payload, line),
        level: this.parseLogLevel(payload ?? {}, line),
        source,
        summary: this.buildLogSummary(payload, line, source),
        requestId: this.extractRequestId(payload),
        raw: line,
        detail: payload,
      };
    });
  }

  private getDiskUsage() {
    try {
      const stats = statfsSync(this.cwd);
      const totalBytes = Number(stats.bsize) * Number(stats.blocks);
      const availableBytes = Number(stats.bsize) * Number(stats.bavail);
      const usedBytes = Math.max(0, totalBytes - availableBytes);
      const usageRate = totalBytes > 0 ? usedBytes / totalBytes : null;
      return {
        path: this.cwd,
        totalBytes,
        usedBytes,
        availableBytes,
        usageRate,
      };
    } catch (error) {
      return {
        path: this.cwd,
        totalBytes: null,
        usedBytes: null,
        availableBytes: null,
        usageRate: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private getPm2Summary() {
    try {
      const raw = execFileSync('pm2', ['jlist'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const app = (JSON.parse(raw) as Array<Record<string, unknown>>).find((item) => item.name === this.appName);
      if (!app) {
        return { available: false as const, status: 'unavailable' as const, reason: '未找到 PM2 应用' };
      }

      const env = (app.pm2_env ?? {}) as Record<string, unknown>;
      const monit = (app.monit ?? {}) as Record<string, unknown>;
      const pmUptime = typeof env.pm_uptime === 'number' ? env.pm_uptime : null;
      return {
        available: true as const,
        status: typeof env.status === 'string' ? env.status : 'unknown',
        pid: typeof app.pid === 'number' ? app.pid : null,
        restarts: typeof env.restart_time === 'number' ? env.restart_time : 0,
        unstableRestarts: typeof env.unstable_restarts === 'number' ? env.unstable_restarts : 0,
        uptimeMs: pmUptime ? Date.now() - pmUptime : null,
        memoryBytes: typeof monit.memory === 'number' ? monit.memory : null,
        cpuPercent: typeof monit.cpu === 'number' ? monit.cpu : null,
      };
    } catch (error) {
      return {
        available: false as const,
        status: 'unavailable' as const,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async overview(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanViewOps(user.roleCode);

    const health = await this.healthService.check();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = Math.max(0, totalMem - freeMem);
    const pm2 = this.getPm2Summary();

    return {
      code: 0,
      message: 'ok',
      data: {
        status: health.status,
        checkedAt: health.checkedAt,
        app: {
          uptimeSeconds: health.uptimeSeconds,
          nodeVersion: process.version,
        },
        dependencies: health.dependencies,
        error: health.error ?? null,
        server: {
          hostname: os.hostname(),
          platform: os.platform(),
          cpu: {
            coreCount: cpus.length,
            model: cpus[0]?.model ?? 'unknown',
            loadAverage: loadAvg,
            usageRate: cpus.length > 0 ? Math.min(1, loadAvg[0] / cpus.length) : null,
          },
          memory: {
            totalBytes: totalMem,
            usedBytes: usedMem,
            freeBytes: freeMem,
            usageRate: totalMem > 0 ? usedMem / totalMem : null,
          },
          disk: this.getDiskUsage(),
        },
        process: {
          pid: process.pid,
          memoryBytes: process.memoryUsage().rss,
          pm2,
        },
      },
    };
  }

  async logs(authorization: string | undefined, query: AdminOpsLogsQueryDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanViewOps(user.roleCode);

    const level = query.level ?? 'error';
    const sinceHours = query.sinceHours ?? 24;
    const limit = query.limit ?? 50;
    const cutoff = Date.now() - sinceHours * 60 * 60 * 1000;
    const candidates = this.getLogCandidates();
    const errorLog = this.firstExisting(candidates.error);
    const outLog = this.firstExisting(candidates.out);

    const seen = new Set<string>();
    const rows = [...this.parseRows(errorLog, 'error.log'), ...this.parseRows(outLog, outLog?.endsWith('app.log') ? 'app.log' : 'out.log')]
      .filter((row) => !this.isNoisyAccessLog(row.detail))
      .filter((row) => {
        const key = row.raw;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .filter((row) => {
        if (!row.time) return true;
        const parsed = Date.parse(row.time);
        return Number.isNaN(parsed) ? true : parsed >= cutoff;
      })
      .filter((row) => {
        if (level === 'all') return row.level !== 'unknown' || Boolean(row.detail);
        return row.level === level;
      })
      .sort((a, b) => {
        const ta = a.time ? Date.parse(a.time) : 0;
        const tb = b.time ? Date.parse(b.time) : 0;
        return tb - ta;
      });

    return {
      code: 0,
      message: 'ok',
      data: {
        items: rows.slice(0, limit),
        total: rows.length,
        level,
        sinceHours,
        limit,
        sources: {
          errorLog,
          outLog,
        },
      },
    };
  }
}
