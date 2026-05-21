import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

enum ModuleTypeDto {
  GENERAL = 'general',
  SUBJECT = 'subject',
}

enum ScoreTypeDto {
  ADD = 'add',
  DEDUCT = 'deduct',
}

enum SentimentDto {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

enum ScoreTargetDto {
  STUDENT = 'student',
  CLASS = 'class',
}

export class ScoreRuleUpsertDto {
  @ApiProperty()
  @IsInt()
  semesterId!: number;

  @ApiProperty({ enum: ModuleTypeDto })
  @IsEnum(ModuleTypeDto)
  moduleType!: ModuleTypeDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subjectCode?: string;

  @ApiProperty()
  @IsString()
  sceneCode!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: ScoreTypeDto })
  @IsEnum(ScoreTypeDto)
  scoreType!: ScoreTypeDto;

  @ApiProperty({ enum: ScoreTargetDto, default: ScoreTargetDto.STUDENT })
  @IsOptional()
  @IsEnum(ScoreTargetDto)
  scoreTarget?: ScoreTargetDto;

  @ApiProperty()
  @IsInt()
  scoreValue!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dimension?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ enum: SentimentDto })
  @IsEnum(SentimentDto)
  sentiment!: SentimentDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  aiSummaryText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedRoleCodes?: string[];

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isHighFrequency?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  displayEnabled?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  adminEnabled?: boolean;
}
