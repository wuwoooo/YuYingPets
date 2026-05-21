#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const appName = process.env.PM2_APP_NAME || 'yuyingpets-backend';
const cwd = path.resolve(__dirname, '..');
const lines = Number(process.env.LOG_REPORT_LINES || 1000);
const pm2Home = process.env.PM2_HOME || path.join(process.env.HOME || '', '.pm2');
const candidates = {
  error: [
    process.env.LOG_REPORT_ERROR_LOG,
    path.join(cwd, 'logs/error.log'),
    path.join(pm2Home, 'logs', `${appName}-error.log`),
  ].filter(Boolean),
  out: [
    process.env.LOG_REPORT_OUT_LOG,
    path.join(cwd, 'logs/out.log'),
    path.join(pm2Home, 'logs', `${appName}-out.log`),
  ].filter(Boolean),
};

function firstExisting(paths) {
  return paths.find((item) => fs.existsSync(item));
}

function tail(file, count) {
  if (!file) return [];
  const content = fs.readFileSync(file, 'utf8');
  const rows = content.split(/\r?\n/).filter(Boolean);
  return rows.slice(Math.max(0, rows.length - count));
}

function parseJsonLine(line) {
  const start = line.indexOf('{');
  if (start < 0) return null;
  try {
    return JSON.parse(line.slice(start));
  } catch {
    return null;
  }
}

function summarizeStructured(rows) {
  const status = {};
  const slow = [];
  const failed = [];

  for (const row of rows) {
    const payload = parseJsonLine(row);
    if (!payload) continue;

    if (typeof payload.statusCode === 'number') {
      const bucket = `${Math.floor(payload.statusCode / 100)}xx`;
      status[bucket] = (status[bucket] || 0) + 1;
    }

    if (typeof payload.durationMs === 'number' && payload.durationMs >= 1000) {
      slow.push({
        time: payload.time,
        method: payload.method,
        path: payload.path,
        statusCode: payload.statusCode,
        durationMs: payload.durationMs,
        requestId: payload.requestId,
      });
    }

    if (typeof payload.statusCode === 'number' && payload.statusCode >= 500) {
      failed.push({
        time: payload.time,
        method: payload.method,
        path: payload.path,
        statusCode: payload.statusCode,
        requestId: payload.requestId,
        error: payload.error?.message,
      });
    }
  }

  slow.sort((a, b) => b.durationMs - a.durationMs);
  return {
    status,
    slowTop10: slow.slice(0, 10),
    failedTop10: failed.slice(-10),
  };
}

function summarizeErrorRows(rows) {
  const patterns = [
    'Cannot find module',
    'PrismaClientKnownRequestError',
    'unhandled_rejection',
    'uncaught_exception',
    'bootstrap_failed',
    'The table',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ];
  const counts = {};
  for (const row of rows) {
    for (const pattern of patterns) {
      if (row.includes(pattern)) {
        counts[pattern] = (counts[pattern] || 0) + 1;
      }
    }
  }
  return counts;
}

function pm2Summary() {
  try {
    const raw = execFileSync('pm2', ['jlist'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const app = JSON.parse(raw).find((item) => item.name === appName);
    if (!app) return { found: false };

    return {
      found: true,
      status: app.pm2_env?.status,
      pid: app.pid,
      restarts: app.pm2_env?.restart_time,
      unstableRestarts: app.pm2_env?.unstable_restarts,
      uptimeMs: app.pm2_env?.pm_uptime ? Date.now() - app.pm2_env.pm_uptime : null,
      memoryBytes: app.monit?.memory,
      cpu: app.monit?.cpu,
      script: app.pm2_env?.pm_exec_path,
    };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

const errorLog = firstExisting(candidates.error);
const outLog = firstExisting(candidates.out);
const errorRows = tail(errorLog, lines);
const outRows = tail(outLog, lines);

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      appName,
      logs: {
        errorLog,
        outLog,
        inspectedLinesPerFile: lines,
      },
      pm2: pm2Summary(),
      http: summarizeStructured(outRows),
      errors: summarizeErrorRows(errorRows),
      recentErrorLines: errorRows.slice(-20),
    },
    null,
    2,
  ),
);
