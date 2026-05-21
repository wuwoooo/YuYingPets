import { IsIn } from 'class-validator';

export class PresentationModeUpdateDto {
  @IsIn(['report', 'daily'])
  mode!: 'report' | 'daily';
}
