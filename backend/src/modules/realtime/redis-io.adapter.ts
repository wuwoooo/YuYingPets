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

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(redisUrl: string) {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

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
    const tasks: Promise<unknown>[] = [];
    if (this.pubClient) {
      tasks.push(this.pubClient.quit());
      this.pubClient = null;
    }
    if (this.subClient) {
      tasks.push(this.subClient.quit());
      this.subClient = null;
    }
    await Promise.allSettled(tasks);
  }
}
