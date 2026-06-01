import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TerminalSourceDto } from '../../score-records/dto/terminal-source.enum';

export class GroupScoreResetDto {
  @ApiProperty({ enum: TerminalSourceDto })
  @IsEnum(TerminalSourceDto)
  sourceTerminal!: TerminalSourceDto;
}
