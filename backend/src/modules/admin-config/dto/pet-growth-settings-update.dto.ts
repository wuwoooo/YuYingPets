import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class PetGrowthSettingsUpdateDto {
  @ApiProperty({ type: [Number], minItems: 10, maxItems: 10 })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  thresholds!: number[];
}
