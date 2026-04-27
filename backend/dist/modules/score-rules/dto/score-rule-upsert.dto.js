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
exports.ScoreRuleUpsertDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ModuleTypeDto;
(function (ModuleTypeDto) {
    ModuleTypeDto["GENERAL"] = "general";
    ModuleTypeDto["SUBJECT"] = "subject";
})(ModuleTypeDto || (ModuleTypeDto = {}));
var ScoreTypeDto;
(function (ScoreTypeDto) {
    ScoreTypeDto["ADD"] = "add";
    ScoreTypeDto["DEDUCT"] = "deduct";
})(ScoreTypeDto || (ScoreTypeDto = {}));
var SentimentDto;
(function (SentimentDto) {
    SentimentDto["POSITIVE"] = "positive";
    SentimentDto["NEGATIVE"] = "negative";
})(SentimentDto || (SentimentDto = {}));
class ScoreRuleUpsertDto {
}
exports.ScoreRuleUpsertDto = ScoreRuleUpsertDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ScoreRuleUpsertDto.prototype, "semesterId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ModuleTypeDto }),
    (0, class_validator_1.IsEnum)(ModuleTypeDto),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "moduleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "subjectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "sceneCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ScoreTypeDto }),
    (0, class_validator_1.IsEnum)(ScoreTypeDto),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "scoreType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ScoreRuleUpsertDto.prototype, "scoreValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "dimension", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "tag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SentimentDto }),
    (0, class_validator_1.IsEnum)(SentimentDto),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "sentiment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "aiSummaryText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRuleUpsertDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ScoreRuleUpsertDto.prototype, "isHighFrequency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ScoreRuleUpsertDto.prototype, "displayEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ScoreRuleUpsertDto.prototype, "adminEnabled", void 0);
//# sourceMappingURL=score-rule-upsert.dto.js.map