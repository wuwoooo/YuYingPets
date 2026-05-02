import { IsISO8601, IsOptional } from 'class-validator';

export class TeacherLiveStatusQueryDto {
  @IsOptional()
  @IsISO8601()
  at?: string;

  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @IsOptional()
  @IsISO8601()
  endAt?: string;
}
