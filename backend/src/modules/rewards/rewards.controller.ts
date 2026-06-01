import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RewardsService } from './rewards.service';
import { RewardUpsertDto } from './dto/reward-upsert.dto';
import { RewardOrderCreateDto } from './dto/reward-order-create.dto';

@ApiTags('Rewards')
@Controller()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('rewards')
  list(@Headers('authorization') authorization: string | undefined, @Query() query: Record<string, string>) {
    return this.rewardsService.list(authorization, query);
  }

  @Post('rewards')
  create(@Headers('authorization') authorization: string | undefined, @Body() body: RewardUpsertDto) {
    return this.rewardsService.create(authorization, body);
  }

  @Put('rewards/:id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: RewardUpsertDto,
  ) {
    return this.rewardsService.update(authorization, Number(id), body);
  }

  @Post('rewards/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadRewardAsset(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    return this.rewardsService.uploadRewardAsset(authorization, file);
  }

  @Put('rewards/:id/status')
  updateStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body('status') status: 'enabled' | 'disabled',
  ) {
    return this.rewardsService.updateStatus(authorization, Number(id), status);
  }

  @Delete('rewards/:id')
  deleteReward(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.rewardsService.deleteReward(authorization, Number(id));
  }

  @Get('reward-orders')
  orders(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: Record<string, string>,
  ) {
    return this.rewardsService.orders(authorization, query);
  }

  @Post('reward-orders')
  createOrder(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: RewardOrderCreateDto,
  ) {
    return this.rewardsService.createOrder(authorization, body);
  }
}
