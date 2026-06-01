import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PetDecorationsService } from './pet-decorations.service';
import { EquipDecorationDto } from './dto/equip-decoration.dto';
import { EquipThemeDto } from './dto/equip-theme.dto';

@ApiTags('PetDecorations')
@Controller()
export class PetDecorationsController {
  constructor(private readonly service: PetDecorationsService) {}

  @Get('display/classes/:classId/pet-decorations')
  async listByClass(@Param('classId') classId: string) {
    return this.service.listByClass(Number(classId));
  }

  @Get('student-pets/:studentPetId/decorations')
  async listUnlocked(@Param('studentPetId') studentPetId: string) {
    return this.service.listUnlocked(Number(studentPetId));
  }

  @Get('student-pets/:studentPetId/decorations/change-policy')
  async changePolicy(@Param('studentPetId') studentPetId: string) {
    return this.service.getChangePolicy(Number(studentPetId));
  }

  @Post('student-pets/:studentPetId/decorations/equip')
  async equip(
    @Headers('authorization') authorization: string | undefined,
    @Param('studentPetId') studentPetId: string,
    @Body() dto: EquipDecorationDto,
  ) {
    return this.service.equip(authorization, Number(studentPetId), dto);
  }

  @Post('student-pets/:studentPetId/decorations/equip-theme')
  async equipTheme(
    @Headers('authorization') authorization: string | undefined,
    @Param('studentPetId') studentPetId: string,
    @Body() dto: EquipThemeDto,
  ) {
    return this.service.equipTheme(authorization, Number(studentPetId), dto);
  }
}
