"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherObservationsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const operation_log_module_1 = require("../operation-log/operation-log.module");
const teacher_observations_controller_1 = require("./teacher-observations.controller");
const teacher_observations_service_1 = require("./teacher-observations.service");
let TeacherObservationsModule = class TeacherObservationsModule {
};
exports.TeacherObservationsModule = TeacherObservationsModule;
exports.TeacherObservationsModule = TeacherObservationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, operation_log_module_1.OperationLogModule, config_1.ConfigModule],
        controllers: [teacher_observations_controller_1.TeacherObservationsController],
        providers: [teacher_observations_service_1.TeacherObservationsService],
    })
], TeacherObservationsModule);
//# sourceMappingURL=teacher-observations.module.js.map