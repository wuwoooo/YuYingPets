import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import type { ServerOptions } from 'socket.io';
import { rootLogger } from '@/logging/root-logger';

type SocketIoRedisAdapter = ReturnType<typeof createAdapter>;

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = rootLogger.child({ context: 'redis_io_adapter' });
  private redisAdapter: SocketIoRedisAdapter | null = null;
  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;
  private isClosing = false;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(redisUrl: string) {
    const pubClient = createClient({
      url: redisUrl,
      pingInterval: 10000,
    });
    const subClient = pubClient.duplicate();

    this.bindRedisClientEvents('pub', pubClient);
    this.bindRedisClientEvents('sub', subClient);
    this.wrapPublish(pubClient);

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.isClosing = false;
    this.pubClient = pubClient;
    this.subClient = subClient;
    this.redisAdapter = createAdapter(pubClient, subClient);

    this.logger.info({ msg: 'socket_io_redis_adapter_connected' });
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.redisAdapter) {
      server.adapter(this.redisAdapter);
    }
    return server;
  }

  async close() {
    this.isClosing = true;
    const tasks: Promise<unknown>[] = [];
    if (this.pubClient) {
      tasks.push(this.safeQuit('pub', this.pubClient));
      this.pubClient = null;
    }
    if (this.subClient) {
      tasks.push(this.safeQuit('sub', this.subClient));
      this.subClient = null;
    }
    await Promise.allSettled(tasks);
  }

  private bindRedisClientEvents(role: 'pub' | 'sub', client: RedisClientType) {
    client.on('error', (error) => {
      this.logger.error({
        msg: 'socket_io_redis_client_error',
        role,
        error: {
          name: error.name,
          message: error.message,
        },
      });
    });

    client.on('end', () => {
      this.logger.warn({
        msg: 'socket_io_redis_client_closed',
        role,
      });
    });

    client.on('reconnecting', () => {
      this.logger.warn({
        msg: 'socket_io_redis_client_reconnecting',
        role,
      });
    });

    client.on('ready', () => {
      this.logger.info({
        msg: 'socket_io_redis_client_ready',
        role,
      });
    });
  }

  private wrapPublish(client: RedisClientType) {
    const originalPublish = client.publish.bind(client);
    const mutableClient = client as RedisClientType & {
      publish: typeof originalPublish;
    };

    mutableClient.publish = ((...args: Parameters<typeof originalPublish>) => {
      if (this.isClosing || !client.isOpen) {
        this.logger.warn({
          msg: 'socket_io_redis_publish_skipped',
          reason: this.isClosing ? 'adapter_closing' : 'client_closed',
          channel: String(args[0]),
        });
        return Promise.resolve(0);
      }

      return originalPublish(...args).catch((error: Error) => {
        this.logger.error({
          msg: 'socket_io_redis_publish_failed',
          channel: String(args[0]),
          error: {
            name: error.name,
            message: error.message,
          },
        });
        return 0;
      });
    }) as typeof client.publish;
  }

  private async safeQuit(role: 'pub' | 'sub', client: RedisClientType) {
    if (!client.isOpen) {
      return;
    }

    try {
      await client.quit();
    } catch (error) {
      const redisError = error instanceof Error ? error : new Error(String(error));
      this.logger.warn({
        msg: 'socket_io_redis_client_quit_failed',
        role,
        error: {
          name: redisError.name,
          message: redisError.message,
        },
      });
    }
  }
}
