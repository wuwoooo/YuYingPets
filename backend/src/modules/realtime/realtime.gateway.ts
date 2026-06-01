import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthUser } from '@/common/auth/auth-user.interface';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

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

const allowedSocketOrigins = new Set(parseCsvEnv(process.env.CORS_ORIGINS));

type RealtimeSocket = Socket & {
  data: Socket['data'] & {
    user?: AuthUser;
    displayTerminal?: {
      id: bigint;
      schoolId: bigint;
      classId: bigint | null;
      terminalCode: string;
    };
    authReady?: Promise<AuthUser | null>;
  };
};

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin || allowedSocketOrigins.has(origin)) {
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
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket) {
    const socket = client as RealtimeSocket;
    socket.data.authReady = this.authenticateConnection(socket);
    try {
      await socket.data.authReady;
      this.logger.debug(`socket connected: ${socket.id}`);
    } catch {
      // authenticateConnection 已处理断开连接
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe.class')
  async handleSubscribeClass(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { classId: number },
  ) {
    if (!body?.classId) {
      return { ok: false, message: '缺少 classId' };
    }

    const socket = client as RealtimeSocket;
    const user = await this.requireAuthenticatedUser(socket);
    if (user) {
      this.authService.ensureCanAccessClass(user, body.classId);
      client.join(`class:${body.classId}`);
      return { ok: true, room: `class:${body.classId}` };
    }

    const displayTerminal = await this.requireDisplayTerminal(socket);
    if (!displayTerminal) {
      return { ok: false, message: '未认证' };
    }
    if (Number(displayTerminal.classId) !== Number(body.classId)) {
      return { ok: false, message: '当前终端无权订阅该班级' };
    }

    client.join(`class:${body.classId}`);
    return { ok: true, room: `class:${body.classId}` };
  }

  @SubscribeMessage('subscribe.school')
  async handleSubscribeSchool(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { schoolId: number },
  ) {
    if (!body?.schoolId) {
      return { ok: false, message: '缺少 schoolId' };
    }

    const user = await this.requireAuthenticatedUser(client as RealtimeSocket);
    if (!user) {
      return { ok: false, message: '未认证' };
    }

    if (Number(user.schoolId) !== Number(body.schoolId)) {
      return { ok: false, message: '无权订阅当前学校' };
    }
    client.join(`school:${body.schoolId}`);
    return { ok: true, room: `school:${body.schoolId}` };
  }

  @SubscribeMessage('subscribe.display')
  async handleSubscribeDisplay(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { terminalCode: string },
  ) {
    const terminalCode = body?.terminalCode?.trim();
    if (!terminalCode) {
      return { ok: false, message: '缺少 terminalCode' };
    }

    const socket = client as RealtimeSocket;
    const user = await this.requireAuthenticatedUser(socket);
    if (user) {
      const terminal = await this.prisma.displayTerminal.findFirst({
        where: { terminalCode, schoolId: user.schoolId, status: 'enabled' },
        select: { id: true },
      });
      if (!terminal) {
        return { ok: false, message: '无权订阅当前展示终端' };
      }
    } else {
      const displayTerminal = await this.requireDisplayTerminal(socket);
      if (!displayTerminal) {
        return { ok: false, message: '未认证' };
      }
      if (displayTerminal.terminalCode !== terminalCode) {
        return { ok: false, message: '当前终端无权订阅该展示通道' };
      }
    }

    client.join(`display:${terminalCode}`);
    await this.prisma.displayTerminal.updateMany({
      where: { terminalCode, status: 'enabled' },
      data: { lastOnlineAt: new Date() },
    });
    return { ok: true, room: `display:${terminalCode}` };
  }

  @SubscribeMessage('unsubscribe.room')
  handleUnsubscribeRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room: string },
  ) {
    if (!body?.room) {
      return { ok: false, message: '缺少 room' };
    }

    client.leave(body.room);
    return { ok: true, room: body.room };
  }

  private async authenticateConnection(client: RealtimeSocket) {
    try {
      const user = await this.authService.getAuthUserFromAuthorization(
        this.extractAuthorization(client),
      );
      client.data.user = user;
      client.emit('auth.ready', { ok: true });
      return user;
    } catch {
      const displayTerminal = await this.authenticateDisplayTerminal(client);
      if (displayTerminal) {
        client.data.displayTerminal = displayTerminal;
        client.emit('auth.ready', { ok: true });
        return null;
      }
      client.emit('auth.ready', { ok: false });
      this.logger.warn(`socket rejected: ${client.id}`);
      client.disconnect(true);
      throw new Error('socket authentication failed');
    }
  }

  private async requireAuthenticatedUser(client: RealtimeSocket): Promise<AuthUser | null> {
    if (client.data.user) {
      return client.data.user;
    }

    const authReady = client.data.authReady;
    if (!authReady) {
      return null;
    }

    try {
      return await authReady;
    } catch {
      return null;
    }
  }

  private async requireDisplayTerminal(
    client: RealtimeSocket,
  ): Promise<RealtimeSocket['data']['displayTerminal'] | null> {
    if (client.data.displayTerminal) {
      return client.data.displayTerminal;
    }

    const authReady = client.data.authReady;
    if (!authReady) {
      return null;
    }

    try {
      await authReady;
      return client.data.displayTerminal ?? null;
    } catch {
      return null;
    }
  }

  private async authenticateDisplayTerminal(client: RealtimeSocket) {
    const terminalCode = this.extractTerminalCode(client);
    if (!terminalCode) {
      return null;
    }

    return this.prisma.displayTerminal.findFirst({
      where: {
        terminalCode,
        status: 'enabled',
      },
      select: {
        id: true,
        schoolId: true,
        classId: true,
        terminalCode: true,
      },
    });
  }

  private extractAuthorization(client: Socket) {
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.trim()) {
      return header;
    }

    const authToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : undefined;
    if (authToken?.trim()) {
      return `Bearer ${authToken.trim()}`;
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return `Bearer ${queryToken.trim()}`;
    }

    return undefined;
  }

  private extractTerminalCode(client: Socket) {
    const authTerminalCode =
      typeof client.handshake.auth?.terminalCode === 'string'
        ? client.handshake.auth.terminalCode
        : undefined;
    if (authTerminalCode?.trim()) {
      return authTerminalCode.trim();
    }

    const queryTerminalCode = client.handshake.query?.terminalCode;
    if (typeof queryTerminalCode === 'string' && queryTerminalCode.trim()) {
      return queryTerminalCode.trim();
    }

    return undefined;
  }
}
