import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminInsightsService } from './admin-insights.service';
import { PetUpsertDto } from './dto/pet-upsert.dto';

@ApiTags('AdminInsights')
@Controller('admin')
export class AdminInsightsController {
  constructor(private readonly adminInsightsService: AdminInsightsService) {}

  @Get('analytics')
  analytics(
    @Headers('authorization') authorization: string | undefined,
    @Query('gradeName') gradeName?: string,
    @Query('classId') classId?: string,
    @Query('regenerateAi') regenerateAi?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminInsightsService.analytics(authorization, {
      gradeName,
      classId: classId ? Number(classId) : undefined,
      regenerateAi: regenerateAi === 'true',
      startDate,
      endDate,
    });
  }

  @Get('analytics/report-status')
  analyticsReportStatus(
    @Headers('authorization') authorization: string | undefined,
    @Query('classId') classId?: string,
    @Query('gradeName') gradeName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminInsightsService.analyticsReportStatus(
      authorization,
      classId ? Number(classId) : undefined,
      gradeName,
      startDate,
      endDate,
    );
  }

  @Get('pets')
  pets(@Headers('authorization') authorization: string | undefined, @Query('category') category?: string) {
    return this.adminInsightsService.listPets(authorization, category);
  }

  @Post('pets')
  createPet(@Headers('authorization') authorization: string | undefined, @Body() body: PetUpsertDto) {
    return this.adminInsightsService.createPet(authorization, body);
  }

  @Post('pets/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadPetAsset(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    return this.adminInsightsService.uploadPetAsset(authorization, file);
  }

  @Put('pets/:id')
  updatePet(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: PetUpsertDto,
  ) {
    return this.adminInsightsService.updatePet(authorization, Number(id), body);
  }

  @Put('pets/:id/status')
  updatePetStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body('status') status: 'enabled' | 'disabled',
  ) {
    return this.adminInsightsService.updatePetStatus(authorization, Number(id), status);
  }

  @Delete('pets/:id')
  deletePet(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.adminInsightsService.deletePet(authorization, Number(id));
  }
}
