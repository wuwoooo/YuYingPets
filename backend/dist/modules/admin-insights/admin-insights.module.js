"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminInsightsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const operation_log_module_1 = require("../operation-log/operation-log.module");
const admin_insights_controller_1 = require("./admin-insights.controller");
const admin_insights_service_1 = require("./admin-insights.service");
let AdminInsightsModule = class AdminInsightsModule {
};
exports.AdminInsightsModule = AdminInsightsModule;
exports.AdminInsightsModule = AdminInsightsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, operation_log_module_1.OperationLogModule, config_1.ConfigModule],
        controllers: [admin_insights_controller_1.AdminInsightsController],
        providers: [admin_insights_service_1.AdminInsightsService],
    })
], AdminInsightsModule);
//# sourceMappingURL=admin-insights.module.js.map