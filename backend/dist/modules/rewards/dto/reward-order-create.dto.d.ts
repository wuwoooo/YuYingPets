import { TerminalSourceDto } from '@/modules/score-records/dto/terminal-source.enum';
export declare class RewardOrderCreateDto {
    classId: number;
    studentId: number;
    rewardId: number;
    sourceTerminal: TerminalSourceDto;
}
