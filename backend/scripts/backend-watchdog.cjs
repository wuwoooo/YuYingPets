#!/usr/bin/env node

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const appName = process.env.PM2_APP_NAME || 'yuyingpets-backend';
const baseUrl = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5000);
const restartOnDegraded = process.env.WATCHDOG_RESTART_ON_DEGRADED === '1';
const logDir = process.env.WATCHDOG_LOG_DIR || path.resolve(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'watchdog.log');
const url = new URL('/api/v1/health', baseUrl);
const client = url.protocol === 'https:' ? https : http;

function writeLog(payload) {
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logFile, `${JSON.stringify({ time: new Date().toISOString(), ...payload })}\n`);
}

function restart(reason, detail) {
  writeLog({ level: 'warn', action: 'restart', reason, detail });
  execFileSync('pm2', ['restart', appName, '--update-env'], { stdio: 'pipe' });
  execFileSync('pm2', ['save'], { stdio: 'pipe' });
}

function handleHealth(statusCode, body) {
  let payload = null;
  try {
    payload = JSON.parse(body);
  } catch {
    payload = { raw: body.slice(0, 500) };
  }

  if (statusCode === 200 && payload.status === 'ok') {
    writeLog({ level: 'info', action: 'healthy', statusCode });
    return;
  }

  const degraded = statusCode === 503 && payload.status === 'degraded';
  if (degraded && !restartOnDegraded) {
    writeLog({ level: 'error', action: 'degraded_no_restart', statusCode, payload });
    process.exitCode = 1;
    return;
  }

  restart('healthcheck_failed', { statusCode, payload });
}

const request = client.get(url, { timeout: timeoutMs }, (response) => {
  let body = '';
  response.setEncoding('utf8');
  response.on('data', (chunk) => {
    body += chunk;
  });
  response.on('end', () => {
    handleHealth(response.statusCode, body);
  });
});

request.on('timeout', () => {
  request.destroy(new Error(`healthcheck timeout after ${timeoutMs}ms`));
});

request.on('error', (error) => {
  restart('healthcheck_unreachable', { url: url.toString(), error: error.message });
});
