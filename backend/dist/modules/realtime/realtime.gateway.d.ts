import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '@/prisma/prisma.service';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeClass(client: Socket, body: {
        classId: number;
    }): {
        ok: boolean;
        message: string;
        room?: undefined;
    } | {
        ok: boolean;
        room: string;
        message?: undefined;
    };
    handleSubscribeSchool(client: Socket, body: {
        schoolId: number;
    }): {
        ok: boolean;
        message: string;
        room?: undefined;
    } | {
        ok: boolean;
        room: string;
        message?: undefined;
    };
    handleSubscribeDisplay(client: Socket, body: {
        terminalCode: string;
    }): Promise<{
        ok: boolean;
        message: string;
        room?: undefined;
    } | {
        ok: boolean;
        room: string;
        message?: undefined;
    }>;
    handleUnsubscribeRoom(client: Socket, body: {
        room: string;
    }): {
        ok: boolean;
        message: string;
        room?: undefined;
    } | {
        ok: boolean;
        room: string;
        message?: undefined;
    };
}
