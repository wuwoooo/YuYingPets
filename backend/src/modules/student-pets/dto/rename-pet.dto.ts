import { IsString, Length } from 'class-validator';

export class RenamePetDto {
  @IsString()
  @Length(1, 12)
  nickname!: string;
}
