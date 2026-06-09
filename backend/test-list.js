const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { ScoreRulesService } = require('./dist/modules/score-rules/score-rules.service');
async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(ScoreRulesService);
  const res = await service.list(undefined, { schoolId: '1' });
  let count = 0;
  for(const mod of res.data) {
    for(const sub of mod.subjects) {
      for(const scene of sub.scenes) {
        for(const rule of scene.rules) {
          if(rule.isHighFrequency) {
             console.log(rule.name, rule.scoreType, rule.displayEnabled, rule.status);
             count++;
          }
        }
      }
    }
  }
  console.log("Total high freq:", count);
  await app.close();
}
run();
