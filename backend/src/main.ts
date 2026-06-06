import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, static as serveStatic, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { NestPinoLogger } from './logging/nest-pino-logger';
import { rootLogger } from './logging/root-logger';
import { RedisIoAdapter } from './modules/realtime/redis-io.adapter';
import { RENEWED_DISPLAY_TOKEN_HEADER } from './common/auth/jwt-auth.guard';

const processLogger = rootLogger.child({ context: 'process' });

function parseCsvEnv(value?: string) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function installProcessHandlers() {
  process.on('unhandledRejection', (reason) => {
    processLogger.fatal({
      msg: 'unhandled_rejection',
      error:
        reason instanceof Error
          ? { name: reason.name, message: reason.message, stack: reason.stack }
          : { message: String(reason) },
    });
    process.exitCode = 1;
  });

  process.on('uncaughtException', (error) => {
    processLogger.fatal({
      msg: 'uncaught_exception',
      error: { name: error.name, message: error.message, stack: error.stack },
    });
    process.exit(1);
  });
}

function validateRuntimeEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`缺少必要环境变量: ${missing.join(', ')}`);
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET === 'replace-with-your-own-secret'
  ) {
    throw new Error('生产环境 JWT_SECRET 不能使用默认占位值');
  }
}

async function bootstrap() {
  installProcessHandlers();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableShutdownHooks();
  app.useLogger(new NestPinoLogger());
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  validateRuntimeEnv();

  const redisIoAdapter = new RedisIoAdapter(app);
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    await redisIoAdapter.connectToRedis(redisUrl);
  } else {
    processLogger.warn({
      msg: 'socket_io_redis_adapter_disabled',
      reason: 'missing REDIS_URL',
    });
  }
  app.useWebSocketAdapter(redisIoAdapter);

  const publicDir = resolve(__dirname, '../public');

  const allowedOrigins = new Set(parseCsvEnv(process.env.CORS_ORIGINS));
  app.enableCors({
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      if (process.env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    exposedHeaders: [RENEWED_DISPLAY_TOKEN_HEADER],
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const incoming = req.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
    res.setHeader('X-Request-Id', requestId);
    req.requestId = requestId;
    next();
  });

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.use(
    '/assets',
    serveStatic(resolve(publicDir, 'assets'), {
      etag: true,
      lastModified: true,
      maxAge: '7d',
    }),
  );
  app.use(
    '/uploads',
    serveStatic(resolve(publicDir, 'uploads'), {
      etag: true,
      lastModified: true,
      maxAge: '1d',
    }),
  );

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('育英星宠 API')
      .setDescription('YuYingPets backend API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const host = process.env.HOST?.trim() || '127.0.0.1';
  await app.listen(port, host);
  app.getHttpServer().once('close', () => {
    void redisIoAdapter.close();
  });

  processLogger.info({
    msg: 'backend_started',
    port,
    host,
    nodeEnv: process.env.NODE_ENV ?? 'unset',
  });
}

void bootstrap().catch((error) => {
  processLogger.fatal({
    msg: 'bootstrap_failed',
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { message: String(error) },
  });
  process.exit(1);
});
