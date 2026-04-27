import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class GradeSettingItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

export class GradeSettingsUpdateDto {
  @ApiProperty({ type: [GradeSettingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeSettingItemDto)
  grades!: GradeSettingItemDto[];
}
