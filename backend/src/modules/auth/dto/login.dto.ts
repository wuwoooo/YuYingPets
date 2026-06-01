import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';

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
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: LoginTerminalType })
  @IsEnum(LoginTerminalType)
  terminalType!: LoginTerminalType;
}
