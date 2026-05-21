import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCallDto {
  @ApiProperty({ description: '可选班级 ID（如果为空，将根据学生所在班级自动分组并发出多个呼叫）', required: false })
  @IsOptional()
  @IsNumber({}, { message: '班级 ID 必须为数字' })
  classId?: number;

  @ApiProperty({ description: '被呼叫的学生 ID 数组' })
  @IsNotEmpty({ message: '学生列表不能为空' })
  @IsArray({ message: '学生列表必须为数组' })
  @IsNumber({}, { each: true, message: '学生 ID 必须为数字' })
  studentIds!: number[];

  @ApiProperty({ description: '呼叫前往的地点名称' })
  @IsNotEmpty({ message: '地点名称不能为空' })
  @IsString({ message: '地点名称必须为字符串' })
  location!: string;
}

