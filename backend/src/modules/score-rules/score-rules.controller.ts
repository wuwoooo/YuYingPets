import { Body, Controller, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ScoreRulesService } from './score-rules.service';
import { ScoreRuleUpsertDto } from './dto/score-rule-upsert.dto';
import { ScoreRuleAiSuggestDto } from './dto/score-rule-ai-suggest.dto';

@ApiTags('ScoreRules')
@Controller('score-rules')
export class ScoreRulesController {
  constructor(private readonly scoreRulesService: ScoreRulesService) {}

  @Get()
  list(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: Record<string, string>,
  ) {
    return this.scoreRulesService.list(authorization, query);
  }

  @Get('tree')
  tree(@Query() query: Record<string, string>) {
    return this.scoreRulesService.tree(query);
  }

  @Post()
  create(@Headers('authorization') authorization: string | undefined, @Body() body: ScoreRuleUpsertDto) {
    return this.scoreRulesService.create(authorization, body);
  }

  @Post('ai-suggest')
  aiSuggest(@Headers('authorization') authorization: string | undefined, @Body() body: ScoreRuleAiSuggestDto) {
    return this.scoreRulesService.aiSuggest(authorization, body);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.scoreRulesService.detail(Number(id));
  }

  @Put(':id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: ScoreRuleUpsertDto,
  ) {
    return this.scoreRulesService.update(authorization, Number(id), body);
  }
}
