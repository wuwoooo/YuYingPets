import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ImportTeacherScheduleDto {
  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  createMissingTeachers?: boolean;

  @IsOptional()
  @IsString()
  creationRoleCode?: string;

  @IsOptional()
  @IsString()
  usernamePrefix?: string;

  @IsOptional()
  @IsString()
  missingTeacherConfigs?: string;

  @IsOptional()
  @IsString()
  missingClassConfigs?: string;
}
