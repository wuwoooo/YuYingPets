import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { TerminalSourceDto } from '../../score-records/dto/terminal-source.enum';

export class GroupScoreAdjustDto {
  @ApiProperty()
  @IsInt()
  classGroupId!: number;

  @ApiProperty({ description: '非 0 整数，可正可负' })
  @IsInt()
  scoreDelta!: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  remark!: string;

  @ApiProperty({ enum: TerminalSourceDto })
  @IsEnum(TerminalSourceDto)
  sourceTerminal!: TerminalSourceDto;
}
