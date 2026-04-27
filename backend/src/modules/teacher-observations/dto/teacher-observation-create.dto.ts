import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class TeacherObservationCreateDto {
  @ApiProperty()
  @IsInt()
  studentId!: number;

  @ApiProperty()
  @IsInt()
  classId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  observationType?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content!: string;
}
