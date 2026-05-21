#!/usr/bin/env node

const http = require('node:http');
const https = require('node:https');

const baseUrl = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5000);
const url = new URL('/api/v1/health', baseUrl);
const client = url.protocol === 'https:' ? https : http;

const request = client.get(url, { timeout: timeoutMs }, (response) => {
  let body = '';
  response.setEncoding('utf8');
  response.on('data', (chunk) => {
    body += chunk;
  });
  response.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body.slice(0, 500) };
    }

    const ok = response.statusCode === 200 && payload.status === 'ok';
    console.log(
      JSON.stringify(
        {
          ok,
          statusCode: response.statusCode,
          url: url.toString(),
          payload,
        },
        null,
        2,
      ),
    );

    process.exit(ok ? 0 : 1);
  });
});

request.on('timeout', () => {
  request.destroy(new Error(`healthcheck timeout after ${timeoutMs}ms`));
});

request.on('error', (error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        url: url.toString(),
        error: error.message,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
