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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreRuleAiSuggestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ScoreRuleAiSuggestDto {
}
exports.ScoreRuleAiSuggestDto = ScoreRuleAiSuggestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ScoreRuleAiSuggestDto.prototype, "semesterId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['general', 'subject'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['general', 'subject']),
    __metadata("design:type", String)
], ScoreRuleAiSuggestDto.prototype, "moduleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleAiSuggestDto.prototype, "subjectCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleAiSuggestDto.prototype, "sceneCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleAiSuggestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['add', 'deduct'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['add', 'deduct']),
    __metadata("design:type", String)
], ScoreRuleAiSuggestDto.prototype, "scoreType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ScoreRuleAiSuggestDto.prototype, "scoreValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['positive', 'negative'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['positive', 'negative']),
    __metadata("design:type", String)
], ScoreRuleAiSuggestDto.prototype, "sentiment", void 0);
//# sourceMappingURL=score-rule-ai-suggest.dto.js.map