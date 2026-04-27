import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class ScoreRuleAiSuggestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  semesterId?: number;

  @ApiPropertyOptional({ enum: ['general', 'subject'] })
  @IsOptional()
  @IsIn(['general', 'subject'])
  moduleType?: 'general' | 'subject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sceneCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['add', 'deduct'] })
  @IsOptional()
  @IsIn(['add', 'deduct'])
  scoreType?: 'add' | 'deduct';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  scoreValue?: number;

  @ApiPropertyOptional({ enum: ['positive', 'negative'] })
  @IsOptional()
  @IsIn(['positive', 'negative'])
  sentiment?: 'positive' | 'negative';
}
