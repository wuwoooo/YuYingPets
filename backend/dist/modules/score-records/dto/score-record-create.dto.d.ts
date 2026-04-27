import { TerminalSourceDto } from './terminal-source.enum';
export declare class ScoreRecordCreateDto {
    classId: number;
    studentId: number;
    ruleId: number;
    remark?: string;
    sourceTerminal: TerminalSourceDto;
}
