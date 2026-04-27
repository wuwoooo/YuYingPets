import { Body, Controller, Get, Headers, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { HonorsService } from './honors.service';
import { HonorUpsertDto } from './dto/honor-upsert.dto';
import { HonorRecordCreateDto } from './dto/honor-record-create.dto';

@ApiTags('Honors')
@Controller()
export class HonorsController {
  constructor(private readonly honorsService: HonorsService) {}

  @Get('honors')
  list(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.honorsService.list(authorization, query);
  }

  @Post('honors')
  create(@Headers('authorization') authorization: string | undefined, @Body() body: HonorUpsertDto) {
    return this.honorsService.create(authorization, body);
  }

  @Put('honors/:id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: HonorUpsertDto,
  ) {
    return this.honorsService.update(authorization, Number(id), body);
  }

  @Post('honors/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadHonorAsset(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    return this.honorsService.uploadHonorAsset(authorization, file);
  }

  @Put('honors/:id/status')
  updateStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body('status') status: 'enabled' | 'disabled',
  ) {
    return this.honorsService.updateStatus(authorization, Number(id), status);
  }

  @Get('honor-records')
  records(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.honorsService.records(authorization, query);
  }

  @Post('honor-records')
  createRecord(@Headers('authorization') authorization: string | undefined, @Body() body: HonorRecordCreateDto) {
    return this.honorsService.createRecord(authorization, body);
  }
}
