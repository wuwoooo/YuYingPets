import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RewardUpsertDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ required: false, enum: ['global', 'class'], default: 'global' })
  @IsOptional()
  @IsIn(['global', 'class'])
  scopeType?: 'global' | 'class';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  classId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  scoreCost!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQty?: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isInfiniteStock?: boolean;
}
