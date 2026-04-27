import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DisplayTerminalStateQueryDto {
  @ApiProperty()
  @IsString()
  terminalCode!: string;
}
