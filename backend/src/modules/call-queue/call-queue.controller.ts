import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CallQueueService } from './call-queue.service';
import { CreateCallDto } from './dto/create-call.dto';
import { AuthService } from '../auth/auth.service';
import { Public } from '@/common/auth/public.decorator';

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

  @Get('classes')
  async getCallableClasses(@Headers('authorization') authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    return this.callQueueService.getCallableClasses(user);
  }

  @Get('class-students')
  async getCallableClassStudents(
    @Headers('authorization') authorization: string | undefined,
    @Query('classId') classId: string,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    return this.callQueueService.getCallableClassStudents(user, Number(classId));
  }

  @Get('list')
  async getQueueList(
    @Headers('authorization') authorization: string | undefined,
    @Query('classId') classId: string,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    return this.callQueueService.getQueueList(user, Number(classId));
  }

  @Get('active/:classId')
  @Public()
  async getActiveCall(
    @Headers('authorization') authorization: string | undefined,
    @Query('displayTerminalCode') displayTerminalCode: string | undefined,
    @Param('classId') classId: string,
  ) {
    if (!authorization && displayTerminalCode) {
      return this.callQueueService.getActiveCallByTerminal(displayTerminalCode, Number(classId));
    }
    if (!authorization) {
      throw new UnauthorizedException('缺少 Authorization');
    }
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    return this.callQueueService.getActiveCall(user, Number(classId));
  }

  @Post(':id/confirm')
  @Public()
  async confirmCall(
    @Headers('authorization') authorization: string | undefined,
    @Query('displayTerminalCode') displayTerminalCode: string | undefined,
    @Param('id') id: string,
  ) {
    if (!authorization && displayTerminalCode) {
      return this.callQueueService.confirmCallByTerminal(displayTerminalCode, Number(id));
    }
    if (!authorization) {
      throw new UnauthorizedException('缺少 Authorization');
    }
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    return this.callQueueService.confirmCall(user, Number(id));
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
