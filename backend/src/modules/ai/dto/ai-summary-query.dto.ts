import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class AiSummaryQueryDto {
  @ApiPropertyOptional({ enum: ['weekly', 'monthly'] })
  @IsOptional()
  @IsIn(['weekly', 'monthly'])
  periodType?: 'weekly' | 'monthly';
}
