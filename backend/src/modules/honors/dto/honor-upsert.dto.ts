import { ApiProperty } from '@nestjs/swagger';
import { HonorCategory } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class HonorUpsertDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: HonorCategory })
  @IsEnum(HonorCategory)
  category!: HonorCategory;

  @ApiProperty()
  @IsString()
  iconUrl!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  conditionType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  conditionConfig?: Record<string, unknown>;
}
