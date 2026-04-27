import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class PetStageUpsertDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  stageNo!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  levelNo!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  imageUrl!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  needScoreTotal!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  animationKey?: string;
}

export class PetUpsertDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rarity?: string;

  @ApiProperty({ required: false, enum: ['system', 'custom'] })
  @IsOptional()
  @IsIn(['system', 'custom'])
  sourceType?: 'system' | 'custom';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [PetStageUpsertDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PetStageUpsertDto)
  stages!: PetStageUpsertDto[];
}
