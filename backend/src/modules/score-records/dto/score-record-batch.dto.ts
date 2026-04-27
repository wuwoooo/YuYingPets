import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { TerminalSourceDto } from './terminal-source.enum';

export class ScoreRecordBatchDto {
  @ApiProperty()
  @IsInt()
  classId!: number;

  @ApiProperty({ type: [Number] })
  @IsArray()
  studentIds!: number[];

  @ApiProperty()
  @IsInt()
  ruleId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ enum: TerminalSourceDto })
  @IsEnum(TerminalSourceDto)
  sourceTerminal!: TerminalSourceDto;
}
