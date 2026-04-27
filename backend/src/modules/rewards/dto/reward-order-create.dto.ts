import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';
import { TerminalSourceDto } from '@/modules/score-records/dto/terminal-source.enum';

export class RewardOrderCreateDto {
  @ApiProperty()
  @IsInt()
  classId!: number;

  @ApiProperty()
  @IsInt()
  studentId!: number;

  @ApiProperty()
  @IsInt()
  rewardId!: number;

  @ApiProperty({ enum: TerminalSourceDto })
  @IsEnum(TerminalSourceDto)
  sourceTerminal!: TerminalSourceDto;
}
