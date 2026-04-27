import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class DisplayUnlockDto {
  @ApiProperty()
  @IsInt()
  classId!: number;

  @ApiProperty()
  @IsString()
  displayTerminalCode!: string;
}
