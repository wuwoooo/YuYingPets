import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { TerminalSourceDto } from '../../score-records/dto/terminal-source.enum';

export class ClassScoreRecordCreateDto {
  @ApiProperty()
  @IsInt()
  classId!: number;

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
