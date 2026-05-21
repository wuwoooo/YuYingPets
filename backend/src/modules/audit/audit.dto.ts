import { ApiPropertyOptional } from '@nestjs/swagger';
import { TerminalType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class OperationLogsQueryDto {
  @ApiPropertyOptional({ minimum: 1, description: '页码，从 1 开始' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, description: '每页条数' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: '业务模块过滤' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  module?: string;

  @ApiPropertyOptional({ description: '动作过滤' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  action?: string;

  @ApiPropertyOptional({ enum: TerminalType, description: '终端类型' })
  @IsOptional()
  @IsEnum(TerminalType)
  terminalType?: TerminalType;

  @ApiPropertyOptional({
    enum: ['all', 'sensitive'],
    description: 'all=全部；sensitive=仅权限、系统配置与批量导入等重点关注范围',
  })
  @IsOptional()
  @IsIn(['all', 'sensitive'])
  scope?: 'all' | 'sensitive';
}
