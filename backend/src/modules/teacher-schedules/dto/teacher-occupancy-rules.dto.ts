import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

export class TeacherOccupancyRuleInputDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  name!: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(5, { each: true })
  weekdays!: number[];

  @IsArray()
  @IsString({ each: true })
  subjectCodes!: string[];

  @Matches(/^\d{1,2}:\d{2}$/)
  startTime!: string;

  @Matches(/^\d{1,2}:\d{2}$/)
  endTime!: string;

  @IsOptional()
  @IsIn(['enabled', 'disabled'])
  status?: 'enabled' | 'disabled';

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateTeacherOccupancyRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherOccupancyRuleInputDto)
  rules!: TeacherOccupancyRuleInputDto[];
}
