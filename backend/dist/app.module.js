"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ai_module_1 = require("./modules/ai/ai.module");
const admin_config_module_1 = require("./modules/admin-config/admin-config.module");
const admin_insights_module_1 = require("./modules/admin-insights/admin-insights.module");
const auth_module_1 = require("./modules/auth/auth.module");
const classes_module_1 = require("./modules/classes/classes.module");
const display_module_1 = require("./modules/display/display.module");
const honors_module_1 = require("./modules/honors/honors.module");
const operation_log_module_1 = require("./modules/operation-log/operation-log.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const rewards_module_1 = require("./modules/rewards/rewards.module");
const score_records_module_1 = require("./modules/score-records/score-records.module");
const score_rules_module_1 = require("./modules/score-rules/score-rules.module");
const students_module_1 = require("./modules/students/students.module");
const teacher_observations_module_1 = require("./modules/teacher-observations/teacher-observations.module");
const prisma_module_1 = require("./prisma/prisma.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            operation_log_module_1.OperationLogModule,
            realtime_module_1.RealtimeModule,
            admin_config_module_1.AdminConfigModule,
            admin_insights_module_1.AdminInsightsModule,
            auth_module_1.AuthModule,
            display_module_1.DisplayModule,
            classes_module_1.ClassesModule,
            students_module_1.StudentsModule,
            score_rules_module_1.ScoreRulesModule,
            score_records_module_1.ScoreRecordsModule,
            rewards_module_1.RewardsModule,
            honors_module_1.HonorsModule,
            ai_module_1.AiModule,
            teacher_observations_module_1.TeacherObservationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map