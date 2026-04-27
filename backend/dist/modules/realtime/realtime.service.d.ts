import { RealtimeGateway } from './realtime.gateway';
export declare class RealtimeService {
    private readonly realtimeGateway;
    constructor(realtimeGateway: RealtimeGateway);
    listOnlineDisplayTerminalCodes(terminalCodes: string[]): Promise<Set<string>>;
    emitClassScoreChanged(classId: number, payload: Record<string, unknown>): void;
    emitDisplayUnlocked(classId: number, terminalCode: string, payload: Record<string, unknown>): void;
    emitRewardOrderCreated(classId: number, payload: Record<string, unknown>): void;
    emitClassStudentChanged(classId: number, payload: Record<string, unknown>): void;
    emitClassGroupChanged(classId: number, payload: Record<string, unknown>): void;
    emitAiSummaryGenerated(classId: number, payload: Record<string, unknown>): void;
}
