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
import { PrismaService } from '@/prisma/prisma.service';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe.class')
  handleSubscribeClass(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { classId: number },
  ) {
    if (!body?.classId) {
      return { ok: false, message: '缺少 classId' };
    }

    client.join(`class:${body.classId}`);
    return { ok: true, room: `class:${body.classId}` };
  }

  @SubscribeMessage('subscribe.school')
  handleSubscribeSchool(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { schoolId: number },
  ) {
    if (!body?.schoolId) {
      return { ok: false, message: '缺少 schoolId' };
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
}
