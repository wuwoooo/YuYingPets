"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../../prisma/prisma.service");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
    }
    handleConnection(client) {
        this.logger.debug(`socket connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.debug(`socket disconnected: ${client.id}`);
    }
    handleSubscribeClass(client, body) {
        if (!body?.classId) {
            return { ok: false, message: '缺少 classId' };
        }
        client.join(`class:${body.classId}`);
        return { ok: true, room: `class:${body.classId}` };
    }
    handleSubscribeSchool(client, body) {
        if (!body?.schoolId) {
            return { ok: false, message: '缺少 schoolId' };
        }
        client.join(`school:${body.schoolId}`);
        return { ok: true, room: `school:${body.schoolId}` };
    }
    async handleSubscribeDisplay(client, body) {
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
    handleUnsubscribeRoom(client, body) {
        if (!body?.room) {
            return { ok: false, message: '缺少 room' };
        }
        client.leave(body.room);
        return { ok: true, room: body.room };
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe.class'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribeClass", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe.school'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribeSchool", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe.display'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleSubscribeDisplay", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe.room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleUnsubscribeRoom", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/ws',
        cors: {
            origin: true,
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map