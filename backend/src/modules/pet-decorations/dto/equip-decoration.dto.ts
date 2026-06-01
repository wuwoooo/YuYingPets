import { IsIn, IsInt, Min } from 'class-validator';

export class EquipDecorationDto {
  @IsInt()
  @Min(1)
  decorationId!: number;

  @IsIn(['equip', 'unequip'])
  action!: 'equip' | 'unequip';
}
