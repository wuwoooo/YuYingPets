import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CallQueueService } from './call-queue.service';
import { CreateCallDto } from './dto/create-call.dto';
import { AuthService } from '../auth/auth.service';

@ApiTags('CallQueue')
@Controller('call-queue')
export class CallQueueController {
  constructor(
    private readonly callQueueService: CallQueueService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async createCall(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CreateCallDto,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    return this.callQueueService.createCall(user, dto);
  }

  @Get('list')
  async getQueueList(
    @Headers('authorization') authorization: string | undefined,
    @Query('classId') classId: string,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.authService.ensureCanAccessClass(user, Number(classId));
    return this.callQueueService.getQueueList(Number(classId));
  }

  @Get('active/:classId')
  async getActiveCall(@Param('classId') classId: string) {
    return this.callQueueService.getActiveCall(Number(classId));
  }

  @Post(':id/confirm')
  async confirmCall(@Param('id') id: string) {
    return this.callQueueService.confirmCall(Number(id));
  }

  @Post(':id/cancel')
  async cancelCall(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    return this.callQueueService.cancelCall(user, Number(id));
  }
}
