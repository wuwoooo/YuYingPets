import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class DisplaySettingsUpdateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bgImageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  weatherLabel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  weatherLatitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  weatherLongitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  animationSpeed?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultMode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowSkipAnimation?: boolean;
}
