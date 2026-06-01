import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Max, Min } from 'class-validator';

export class PetGrowthSettingsUpdateDto {
  @ApiProperty({ type: [Number], minItems: 10, maxItems: 10 })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  thresholds!: number[];

  @ApiProperty({ required: false, description: '班级评价联动到每位学生的积分倍率，0 表示关闭联动' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  classScoreStudentLinkMultiplier!: number;

  @ApiProperty({ required: false, description: '非升级免费机会下，每次更换萌宠装扮消耗的当前积分' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  petDecoChangeCost!: number;
}
