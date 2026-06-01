import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ScoreRecordReverseDto {
  @ApiProperty({ description: '撤销原因' })
  @IsString()
  @MinLength(2)
  remark!: string;
}
