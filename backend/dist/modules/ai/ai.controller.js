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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_service_1 = require("./ai.service");
const ai_summary_query_dto_1 = require("./dto/ai-summary-query.dto");
const ai_generate_dto_1 = require("./dto/ai-generate.dto");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    summary(authorization, studentId, query) {
        return this.aiService.summary(authorization, Number(studentId), query.periodType);
    }
    generate(authorization, studentId, body) {
        return this.aiService.generate(authorization, Number(studentId), body.periodType);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)(':studentId/summary'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ai_summary_query_dto_1.AiSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "summary", null);
__decorate([
    (0, common_1.Post)(':studentId/generate-summary'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ai_generate_dto_1.AiGenerateDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generate", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI'),
    (0, common_1.Controller)('ai/students'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map