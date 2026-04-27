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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const realtime_gateway_1 = require("./realtime.gateway");
let RealtimeService = class RealtimeService {
    constructor(realtimeGateway) {
        this.realtimeGateway = realtimeGateway;
    }
    async listOnlineDisplayTerminalCodes(terminalCodes) {
        const uniqueCodes = Array.from(new Set(terminalCodes.map((code) => code.trim()).filter(Boolean)));
        const onlineRoomSets = await Promise.all(uniqueCodes.map((code) => this.realtimeGateway.server.in(`display:${code}`).allSockets()));
        return uniqueCodes.reduce((result, code, index) => {
            if (onlineRoomSets[index].size > 0) {
                result.add(code);
            }
            return result;
        }, new Set());
    }
    emitClassScoreChanged(classId, payload) {
        this.realtimeGateway.server.to(`class:${classId}`).emit('class.score.changed', payload);
        this.realtimeGateway.server.to(`class:${classId}`).emit('class.leaderboard.changed', payload);
    }
    emitDisplayUnlocked(classId, terminalCode, payload) {
        this.realtimeGateway.server.to(`class:${classId}`).emit('display.unlock.changed', payload);
        this.realtimeGateway.server
            .to(`display:${terminalCode}`)
            .emit('display.unlock.changed', payload);
    }
    emitRewardOrderCreated(classId, payload) {
        this.realtimeGateway.server.to(`class:${classId}`).emit('reward.order.created', payload);
    }
    emitClassStudentChanged(classId, payload) {
        this.realtimeGateway.server.to(`class:${classId}`).emit('class.student.changed', payload);
    }
    emitClassGroupChanged(classId, payload) {
        this.realtimeGateway.server.to(`class:${classId}`).emit('class.group.changed', payload);
    }
    emitAiSummaryGenerated(classId, payload) {
        this.realtimeGateway.server.to(`class:${classId}`).emit('ai.summary.generated', payload);
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway])
], RealtimeService);
//# sourceMappingURL=realtime.service.js.map