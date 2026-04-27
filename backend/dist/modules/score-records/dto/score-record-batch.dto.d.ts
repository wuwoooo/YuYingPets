import { TerminalSourceDto } from './terminal-source.enum';
export declare class ScoreRecordBatchDto {
    classId: number;
    studentIds: number[];
    ruleId: number;
    remark?: string;
    sourceTerminal: TerminalSourceDto;
}
