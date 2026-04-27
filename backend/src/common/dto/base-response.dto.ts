import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = unknown> {
  @ApiProperty({ example: 0 })
  code!: number;

  @ApiProperty({ example: 'ok' })
  message!: string;

  @ApiProperty({ required: false })
  data?: T;
}
