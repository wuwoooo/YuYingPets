import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum LoginTerminalType {
  ADMIN = 'admin',
  DISPLAY = 'display',
}

export class LoginDto {
  @ApiProperty()
  @IsString()
  username!: string;

  @ApiProperty()
  @IsString()
  password!: string;

  @ApiProperty({ enum: LoginTerminalType })
  @IsEnum(LoginTerminalType)
  terminalType!: LoginTerminalType;
}
