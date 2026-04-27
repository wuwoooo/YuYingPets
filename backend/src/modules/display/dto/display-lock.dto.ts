import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class DisplayLockDto {
  @ApiProperty()
  @IsInt()
  classId!: number;

  @ApiProperty()
  @IsString()
  displayTerminalCode!: string;
}
