import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StudentAdoptPetDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  classId!: number;

  @ApiProperty()
  @IsString()
  petCode!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  petName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rarity?: string;

  @ApiProperty({ required: false, enum: ['admin', 'display'] })
  @IsOptional()
  @IsIn(['admin', 'display'])
  sourceTerminal?: 'admin' | 'display';
}
