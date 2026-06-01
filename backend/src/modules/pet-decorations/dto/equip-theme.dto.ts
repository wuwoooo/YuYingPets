import { IsIn, IsString, Length } from 'class-validator';

export class EquipThemeDto {
  @IsString()
  @Length(1, 64)
  themeGroup!: string;

  @IsIn(['equip', 'unequip'])
  action!: 'equip' | 'unequip';
}
