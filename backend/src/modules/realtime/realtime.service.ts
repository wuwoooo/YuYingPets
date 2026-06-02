import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

const DEFAULT_DISPLAY_ONLINE_STALE_MS = 90_000;

@Injectable()
export class RealtimeService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  private getDisplayOnlineStaleMs() {
    const raw = Number(process.env.DISPLAY_ONLINE_STALE_MS ?? DEFAULT_DISPLAY_ONLINE_STALE_MS);
    if (!Number.isFinite(raw) || raw <= 0) {
      return DEFAULT_DISPLAY_ONLINE_STALE_MS;
    }
    return raw;
  }

  isDisplayTerminalRecentlyOnline(lastOnlineAt: Date | string | null | undefined) {
    if (!lastOnlineAt) return false;
    const timestamp = new Date(lastOnlineAt).getTime();
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp <= this.getDisplayOnlineStaleMs();
  }

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

  async resolveDisplayTerminalOnlineCodes(
    terminals: Array<{ terminalCode: string; lastOnlineAt: Date | string | null }>,
  ) {
    const uniqueTerminals = Array.from(
      terminals.reduce((result, terminal) => {
        const code = terminal.terminalCode.trim();
        if (code && !result.has(code)) {
          result.set(code, terminal);
        }
        return result;
      }, new Map<string, { terminalCode: string; lastOnlineAt: Date | string | null }>()),
    ).map(([, terminal]) => terminal);

    const realtimeOnlineCodes = await this.listOnlineDisplayTerminalCodes(
      uniqueTerminals.map((terminal) => terminal.terminalCode),
    );

    return uniqueTerminals.reduce((result, terminal) => {
      if (
        realtimeOnlineCodes.has(terminal.terminalCode) ||
        this.isDisplayTerminalRecentlyOnline(terminal.lastOnlineAt)
      ) {
        result.add(terminal.terminalCode);
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

  emitClassGroupScoreChanged(classId: number, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('class.group_score.changed', payload);
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

  emitHonorGranted(classId: number, payload: Record<string, unknown>) {
    this.realtimeGateway.server.to(`class:${classId}`).emit('class.honor.granted', payload);
  }
}
