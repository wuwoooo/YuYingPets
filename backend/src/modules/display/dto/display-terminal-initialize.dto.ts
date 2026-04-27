import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class DisplayTerminalInitializeDto {
  @ApiProperty()
  @IsString()
  terminalCode!: string;

  @ApiProperty()
  @IsString()
  terminalName!: string;

  @ApiProperty()
  @IsInt()
  classId!: number;
}
