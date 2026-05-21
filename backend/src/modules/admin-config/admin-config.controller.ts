import { Body, Controller, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminConfigService } from './admin-config.service';
import { SchoolSettingsUpdateDto } from './dto/school-settings-update.dto';
import { SemesterSettingsUpdateDto } from './dto/semester-settings-update.dto';
import { DisplaySettingsUpdateDto } from './dto/display-settings-update.dto';
import { GradeSettingsUpdateDto } from './dto/grade-settings-update.dto';
import { PetGrowthSettingsUpdateDto } from './dto/pet-growth-settings-update.dto';
import { PermissionUserUpsertDto } from './dto/permission-user-upsert.dto';
import { PermissionUserStatusUpdateDto } from './dto/permission-user-status-update.dto';
import { PermissionUserImportDto } from './dto/permission-user-import.dto';
import { PresentationModeUpdateDto } from './dto/presentation-mode-update.dto';

@ApiTags('AdminConfig')
@Controller('admin')
export class AdminConfigController {
  constructor(private readonly adminConfigService: AdminConfigService) {}

  @Get('settings')
  settings(@Headers('authorization') authorization: string | undefined) {
    return this.adminConfigService.getSettings(authorization);
  }

  @Put('settings/school')
  updateSchool(@Headers('authorization') authorization: string | undefined, @Body() body: SchoolSettingsUpdateDto) {
    return this.adminConfigService.updateSchool(authorization, body);
  }

  @Put('settings/semester')
  updateSemester(@Headers('authorization') authorization: string | undefined, @Body() body: SemesterSettingsUpdateDto) {
    return this.adminConfigService.updateSemester(authorization, body);
  }

  @Get('settings/display')
  displaySettings(@Headers('authorization') authorization: string | undefined) {
    return this.adminConfigService.getDisplaySettings(authorization);
  }

  @Put('settings/display')
  updateDisplay(@Headers('authorization') authorization: string | undefined, @Body() body: DisplaySettingsUpdateDto) {
    return this.adminConfigService.updateDisplay(authorization, body);
  }

  @Put('settings/presentation-mode')
  setPresentationMode(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: PresentationModeUpdateDto,
  ) {
    return this.adminConfigService.setPresentationMode(authorization, body.mode);
  }

  @Put('settings/grades')
  updateGrades(@Headers('authorization') authorization: string | undefined, @Body() body: GradeSettingsUpdateDto) {
    return this.adminConfigService.updateGrades(authorization, body);
  }

  @Put('settings/pet-growth')
  updatePetGrowth(@Headers('authorization') authorization: string | undefined, @Body() body: PetGrowthSettingsUpdateDto) {
    return this.adminConfigService.updatePetGrowth(authorization, body);
  }

  @Get('permissions/roles')
  roles(@Headers('authorization') authorization: string | undefined) {
    return this.adminConfigService.listRoleTemplates(authorization);
  }

  @Get('permissions/users')
  users(@Headers('authorization') authorization: string | undefined) {
    return this.adminConfigService.listPermissionUsers(authorization);
  }

  @Post('permissions/users')
  createUser(@Headers('authorization') authorization: string | undefined, @Body() body: PermissionUserUpsertDto) {
    return this.adminConfigService.createPermissionUser(authorization, body);
  }

  @Post('permissions/users/import-teachers')
  importUsers(@Headers('authorization') authorization: string | undefined, @Body() body: PermissionUserImportDto) {
    return this.adminConfigService.importPermissionUsers(authorization, body);
  }

  @Put('permissions/users/:id')
  updateUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: PermissionUserUpsertDto,
  ) {
    return this.adminConfigService.updatePermissionUser(authorization, Number(id), body);
  }

  @Post('permissions/users/:id/reset-password')
  resetPassword(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.adminConfigService.resetPassword(authorization, Number(id));
  }

  @Put('permissions/users/:id/status')
  updateUserStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: PermissionUserStatusUpdateDto,
  ) {
    return this.adminConfigService.updatePermissionUserStatus(authorization, Number(id), body.status);
  }
}
