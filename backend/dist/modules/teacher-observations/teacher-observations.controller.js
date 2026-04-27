"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherObservationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const teacher_observations_service_1 = require("./teacher-observations.service");
const teacher_observation_create_dto_1 = require("./dto/teacher-observation-create.dto");
const teacher_observation_ai_polish_dto_1 = require("./dto/teacher-observation-ai-polish.dto");
let TeacherObservationsController = class TeacherObservationsController {
    constructor(teacherObservationsService) {
        this.teacherObservationsService = teacherObservationsService;
    }
    create(authorization, body) {
        return this.teacherObservationsService.create(authorization, body);
    }
    aiPolish(authorization, body) {
        return this.teacherObservationsService.aiPolish(authorization, body);
    }
};
exports.TeacherObservationsController = TeacherObservationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, teacher_observation_create_dto_1.TeacherObservationCreateDto]),
    __metadata("design:returntype", void 0)
], TeacherObservationsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('ai-polish'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, teacher_observation_ai_polish_dto_1.TeacherObservationAiPolishDto]),
    __metadata("design:returntype", void 0)
], TeacherObservationsController.prototype, "aiPolish", null);
exports.TeacherObservationsController = TeacherObservationsController = __decorate([
    (0, swagger_1.ApiTags)('TeacherObservations'),
    (0, common_1.Controller)('teacher-observations'),
    __metadata("design:paramtypes", [teacher_observations_service_1.TeacherObservationsService])
], TeacherObservationsController);
//# sourceMappingURL=teacher-observations.controller.js.map