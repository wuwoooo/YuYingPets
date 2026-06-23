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
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '3G',
      exp_backoff_restart_delay: Number(process.env.PM2_RESTART_BACKOFF_MS || 3000),
      kill_timeout: Number(process.env.PM2_KILL_TIMEOUT_MS || 10000),
      out_file: path.join(cwd, 'logs/out.log'),
      error_file: path.join(cwd, 'logs/error.log'),
      merge_logs: true,
      time: false,
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
        DISPLAY_ONLINE_STALE_MS: process.env.DISPLAY_ONLINE_STALE_MS || '90000',
        MALLOC_ARENA_MAX: process.env.MALLOC_ARENA_MAX || '2',
        MALLOC_TRIM_THRESHOLD_: process.env.MALLOC_TRIM_THRESHOLD_ || '131072',
        MALLOC_MMAP_THRESHOLD_: process.env.MALLOC_MMAP_THRESHOLD_ || '131072',
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
        DISPLAY_ONLINE_STALE_MS: process.env.DISPLAY_ONLINE_STALE_MS || '90000',
        MALLOC_ARENA_MAX: process.env.MALLOC_ARENA_MAX || '2',
        MALLOC_TRIM_THRESHOLD_: process.env.MALLOC_TRIM_THRESHOLD_ || '131072',
        MALLOC_MMAP_THRESHOLD_: process.env.MALLOC_MMAP_THRESHOLD_ || '131072',
      },
    },
  ],
};
