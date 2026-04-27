import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class PermissionUserStatusUpdateDto {
  @ApiProperty({ enum: ['enabled', 'disabled'] })
  @IsIn(['enabled', 'disabled'])
  status!: 'enabled' | 'disabled';
}
