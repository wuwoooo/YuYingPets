import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionUserImportRowDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roles?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teachingClasses?: string;
}

export class PermissionUserImportDto {
  @ApiProperty({ type: [PermissionUserImportRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionUserImportRowDto)
  rows!: PermissionUserImportRowDto[];
}
