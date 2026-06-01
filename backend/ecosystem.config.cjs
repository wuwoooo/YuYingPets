const path = require('node:path');

const cwd = __dirname;

module.exports = {
  apps: [
    {
      name: 'yuyingpets-backend',
      cwd,
      script: path.join(cwd, 'dist/main.js'),
      exec_mode: 'cluster',
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '2G',
      exp_backoff_restart_delay: Number(process.env.PM2_RESTART_BACKOFF_MS || 3000),
      kill_timeout: Number(process.env.PM2_KILL_TIMEOUT_MS || 10000),
      out_file: path.join(cwd, 'logs/out.log'),
      error_file: path.join(cwd, 'logs/error.log'),
      merge_logs: true,
      time: false,
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      },
    },
  ],
};
