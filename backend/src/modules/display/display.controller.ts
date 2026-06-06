import { Body, Controller, Delete, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/auth/public.decorator';
import { DisplayUnlockDto } from './dto/display-unlock.dto';
import { DisplayService } from './display.service';
import { DisplayLockDto } from './dto/display-lock.dto';
import { DisplayTerminalInitializeDto } from './dto/display-terminal-initialize.dto';
import { DisplayWeatherQueryDto } from './dto/display-weather-query.dto';
import { AiGenerateDto } from '../ai/dto/ai-generate.dto';

@ApiTags('Display')
@Controller('display')
export class DisplayController {
  constructor(private readonly displayService: DisplayService) {}

  @Get('terminal-state')
  @Public()
  terminalState(@Query('terminalCode') terminalCode: string) {
    return this.displayService.terminalState(terminalCode);
  }

  @Get('terminals')
  terminals(@Headers('authorization') authorization: string | undefined) {
    return this.displayService.terminals(authorization);
  }

  @Delete('terminals/:id')
  deleteTerminal(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.displayService.deleteTerminal(authorization, Number(id));
  }

  @Get('class-bindings')
  classBindings(
    @Headers('authorization') authorization: string | undefined,
    @Query('terminalCode') terminalCode?: string,
  ) {
    return this.displayService.classBindings(authorization, terminalCode);
  }

  @Post('terminal-initialize')
  terminalInitialize(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: DisplayTerminalInitializeDto,
  ) {
    return this.displayService.terminalInitialize(authorization, dto);
  }

  @Post('unlock')
  unlock(@Headers('authorization') authorization: string | undefined, @Body() dto: DisplayUnlockDto) {
    return this.displayService.unlock(authorization, dto);
  }

  @Post('unlock-renew')
  unlockRenew(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: DisplayUnlockDto,
  ) {
    return this.displayService.unlockRenew(authorization, dto);
  }

  @Get('unlock-status')
  unlockStatus(
    @Headers('authorization') authorization: string | undefined,
    @Query('classId') classId: string,
    @Query('displayTerminalCode') code: string,
  ) {
    return this.displayService.unlockStatus(authorization, Number(classId), code);
  }

  @Post('lock')
  lock(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: DisplayLockDto,
  ) {
    return this.displayService.lock(authorization, dto);
  }

  @Get('entry-config')
  @Public()
  entryConfig(@Query('classId') classId?: string) {
    return this.displayService.entryConfig(classId ? Number(classId) : undefined);
  }

  @Get('weather')
  @Public()
  weather(@Query() query: DisplayWeatherQueryDto) {
    return this.displayService.weather(query);
  }

  @Get('pet-catalog')
  @Public()
  petCatalog() {
    return this.displayService.petCatalog();
  }

  @Get('classes/:classId/home')
  home(@Headers('authorization') authorization: string | undefined, @Param('classId') classId: string) {
    return this.displayService.home(authorization, Number(classId));
  }

  @Get('classes/:classId/leaderboard')
  leaderboard(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
    @Query('type') type: string,
  ) {
    return this.displayService.leaderboard(authorization, Number(classId), type);
  }

  @Get('classes/:classId/roster')
  roster(@Headers('authorization') authorization: string | undefined, @Param('classId') classId: string) {
    return this.displayService.roster(authorization, Number(classId));
  }

  @Get('classes/:classId/class-score-ranking')
  classScoreRanking(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
  ) {
    return this.displayService.classScoreRanking(authorization, Number(classId));
  }

  @Get('classes/:classId/academic-growth')
  academicGrowth(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
    @Query('examId') examId?: string,
  ) {
    return this.displayService.academicGrowth(
      authorization,
      Number(classId),
      examId && Number.isInteger(Number(examId)) && Number(examId) > 0 ? Number(examId) : undefined,
    );
  }

  @Get('classes/:classId/academic-ai/:studentId/summary')
  academicAiSummary(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Query('periodType') periodType?: 'weekly' | 'monthly',
  ) {
    return this.displayService.academicAiSummary(authorization, Number(classId), Number(studentId), periodType);
  }

  @Post('classes/:classId/academic-ai/:studentId/generate')
  academicAiGenerate(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Body() body: AiGenerateDto,
  ) {
    return this.displayService.academicAiGenerate(authorization, Number(classId), Number(studentId), body.periodType);
  }

  @Get('classes/:classId/reward-center')
  rewardCenter(@Headers('authorization') authorization: string | undefined, @Param('classId') classId: string) {
    return this.displayService.rewardCenter(authorization, Number(classId));
  }

  @Get('classes/:classId/honor-records')
  honorRecords(
    @Headers('authorization') authorization: string | undefined,
    @Param('classId') classId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.displayService.honorRecords(authorization, Number(classId), query);
  }
}
