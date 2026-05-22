import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  terminalState(@Query('terminalCode') terminalCode: string) {
    return this.displayService.terminalState(terminalCode);
  }

  @Get('terminals')
  terminals(@Headers('authorization') authorization: string | undefined) {
    return this.displayService.terminals(authorization);
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

  @Get('unlock-status')
  unlockStatus(@Query('classId') classId: string, @Query('displayTerminalCode') code: string) {
    return this.displayService.unlockStatus(Number(classId), code);
  }

  @Post('lock')
  lock(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: DisplayLockDto,
  ) {
    return this.displayService.lock(authorization, dto);
  }

  @Get('entry-config')
  entryConfig(@Query('classId') classId?: string) {
    return this.displayService.entryConfig(classId ? Number(classId) : undefined);
  }

  @Get('weather')
  weather(@Query() query: DisplayWeatherQueryDto) {
    return this.displayService.weather(query);
  }

  @Get('pet-catalog')
  petCatalog() {
    return this.displayService.petCatalog();
  }

  @Get('classes/:classId/home')
  home(@Param('classId') classId: string) {
    return this.displayService.home(Number(classId));
  }

  @Get('classes/:classId/leaderboard')
  leaderboard(@Param('classId') classId: string, @Query('type') type: string) {
    return this.displayService.leaderboard(Number(classId), type);
  }

  @Get('classes/:classId/roster')
  roster(@Param('classId') classId: string) {
    return this.displayService.roster(Number(classId));
  }

  @Get('classes/:classId/class-score-ranking')
  classScoreRanking(@Param('classId') classId: string) {
    return this.displayService.classScoreRanking(Number(classId));
  }

  @Get('classes/:classId/academic-growth')
  academicGrowth(@Param('classId') classId: string, @Query('examId') examId?: string) {
    return this.displayService.academicGrowth(
      Number(classId),
      examId && Number.isInteger(Number(examId)) && Number(examId) > 0 ? Number(examId) : undefined,
    );
  }

  @Get('classes/:classId/academic-ai/:studentId/summary')
  academicAiSummary(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Query('periodType') periodType?: 'weekly' | 'monthly',
  ) {
    return this.displayService.academicAiSummary(Number(classId), Number(studentId), periodType);
  }

  @Post('classes/:classId/academic-ai/:studentId/generate')
  academicAiGenerate(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Body() body: AiGenerateDto,
  ) {
    return this.displayService.academicAiGenerate(Number(classId), Number(studentId), body.periodType);
  }

  @Get('classes/:classId/reward-center')
  rewardCenter(@Param('classId') classId: string) {
    return this.displayService.rewardCenter(Number(classId));
  }
}
