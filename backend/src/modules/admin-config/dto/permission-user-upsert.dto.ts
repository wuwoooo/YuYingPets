import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

class PermissionUserSubjectScopeDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  classId!: number;

  @ApiProperty()
  @IsString()
  subjectCode!: string;
}

export class PermissionUserUpsertDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  username!: string;

  @ApiProperty()
  @IsString()
  roleCode!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  classIds?: number[];

  @ApiProperty({ type: [PermissionUserSubjectScopeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionUserSubjectScopeDto)
  subjectScopes?: PermissionUserSubjectScopeDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  resetPassword?: boolean;
}
