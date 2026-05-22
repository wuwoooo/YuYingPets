import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  async listOnlineDisplayTerminalCodes(terminalCodes: string[]) {
    const uniqueCodes = Array.from(new Set(terminalCodes.map((code) => code.trim()).filter(Boolean)));
    const onlineRoomSets = await Promise.all(
      uniqueCodes.map((code) => this.realtimeGateway.server.in(`display:${code}`).allSockets()),
    );

    return uniqueCodes.reduce((result, code, index) => {
      if (onlineRoomSets[index].size > 0) {
        result.add(code);
      }
      return result;
    }, new Set<string>());
  }

  emitClassScoreChanged(classId: number, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('class.score.changed', payload);
    this.realtimeGateway.server.to(`class:${classId}`).emit('class.leaderboard.changed', payload);
  }

  emitGradeClassRankingChanged(gradeCode: string, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`grade:${gradeCode}`).emit('grade.class_ranking.changed', payload);
  }

  emitDisplayUnlocked(classId: number, terminalCode: string, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('display.unlock.changed', payload);
    this.realtimeGateway.server
      .to(`display:${terminalCode}`)
      .emit('display.unlock.changed', payload);
  }

  emitRewardOrderCreated(classId: number, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('reward.order.created', payload);
  }

  emitClassStudentChanged(classId: number, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('class.student.changed', payload);
  }

  emitClassGroupChanged(classId: number, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('class.group.changed', payload);
  }

  emitClassConfigChanged(classId: number, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('class.config.changed', payload);
  }

  emitAiSummaryGenerated(classId: number, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('ai.summary.generated', payload);
  }

  emitCallQueueChanged(classId: number, payload: Record<string, unknown> | null) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('call.queue.changed', payload);
  }
}

