import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminInsightsService } from './admin-insights.service';
import { PetUpsertDto } from './dto/pet-upsert.dto';

@ApiTags('AdminInsights')
@Controller('admin')
export class AdminInsightsController {
  constructor(private readonly adminInsightsService: AdminInsightsService) {}

  @Get('analytics/summary')
  analyticsSummary(
    @Headers('authorization') authorization: string | undefined,
    @Query('gradeName') gradeName?: string,
    @Query('classId') classId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subjectCode') subjectCode?: string,
  ) {
    return this.adminInsightsService.analyticsSummary(authorization, {
      gradeName,
      classId: classId ? Number(classId) : undefined,
      startDate,
      endDate,
      subjectCode,
    });
  }

  @Get('analytics/heatmap')
  analyticsHeatmap(
    @Headers('authorization') authorization: string | undefined,
    @Query('gradeName') gradeName?: string,
    @Query('classId') classId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subjectCode') subjectCode?: string,
  ) {
    return this.adminInsightsService.analyticsHeatmap(authorization, {
      gradeName,
      classId: classId ? Number(classId) : undefined,
      startDate,
      endDate,
      subjectCode,
    });
  }

  @Get('analytics/ai')
  analyticsAi(
    @Headers('authorization') authorization: string | undefined,
    @Query('gradeName') gradeName?: string,
    @Query('classId') classId?: string,
    @Query('regenerateAi') regenerateAi?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subjectCode') subjectCode?: string,
  ) {
    return this.adminInsightsService.analyticsAi(authorization, {
      gradeName,
      classId: classId ? Number(classId) : undefined,
      regenerateAi: regenerateAi === 'true',
      startDate,
      endDate,
      subjectCode,
    });
  }

  @Get('analytics/report-status')
  analyticsReportStatus(
    @Headers('authorization') authorization: string | undefined,
    @Query('classId') classId?: string,
    @Query('gradeName') gradeName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subjectCode') subjectCode?: string,
  ) {
    return this.adminInsightsService.analyticsReportStatus(
      authorization,
      classId ? Number(classId) : undefined,
      gradeName,
      startDate,
      endDate,
      subjectCode,
    );
  }

  @Get('pets')
  pets(@Headers('authorization') authorization: string | undefined, @Query('category') category?: string) {
    return this.adminInsightsService.listPets(authorization, category);
  }

  @Get('pets/growth-thresholds')
  petGrowthThresholds(@Headers('authorization') authorization: string | undefined) {
    return this.adminInsightsService.getPetGrowthThresholds(authorization);
  }

  @Post('pets')
  createPet(@Headers('authorization') authorization: string | undefined, @Body() body: PetUpsertDto) {
    return this.adminInsightsService.createPet(authorization, body);
  }

  @Post('pets/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
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
