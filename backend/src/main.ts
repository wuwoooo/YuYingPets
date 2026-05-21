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

const processLogger = rootLogger.child({ context: 'process' });

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
  app.useLogger(new NestPinoLogger());
  validateRuntimeEnv();

  const publicDir = resolve(__dirname, '../public');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const incoming = req.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
    res.setHeader('X-Request-Id', requestId);
    req.requestId = requestId;
    next();
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.use('/assets', serveStatic(resolve(publicDir, 'assets')));
  app.use('/uploads', serveStatic(resolve(publicDir, 'uploads')));

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('育英星宠 API')
    .setDescription('YuYingPets backend API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);

  processLogger.info({
    msg: 'backend_started',
    port,
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
