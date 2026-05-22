import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdminOpsLogsQueryDto {
  @ApiPropertyOptional({
    enum: ['all', 'warn', 'error', 'fatal'],
    description: '日志级别过滤，all 为去噪后的全部级别',
  })
  @IsOptional()
  @IsIn(['all', 'warn', 'error', 'fatal'])
  level?: 'all' | 'warn' | 'error' | 'fatal';

  @ApiPropertyOptional({ minimum: 1, maximum: 168, description: '回看最近多少小时' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  sinceHours?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, description: '最多返回多少条日志' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
