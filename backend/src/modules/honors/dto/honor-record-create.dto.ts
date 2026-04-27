import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class HonorRecordCreateDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  honorId!: number;

  @ApiProperty({ enum: ['student', 'class'] })
  @IsIn(['student', 'class'])
  targetType!: 'student' | 'class';

  @ApiProperty()
  @IsInt()
  @Min(1)
  targetId!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  classId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
