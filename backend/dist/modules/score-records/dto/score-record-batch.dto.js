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
exports.ScoreRecordBatchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const terminal_source_enum_1 = require("./terminal-source.enum");
class ScoreRecordBatchDto {
}
exports.ScoreRecordBatchDto = ScoreRecordBatchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ScoreRecordBatchDto.prototype, "classId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Number] }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ScoreRecordBatchDto.prototype, "studentIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ScoreRecordBatchDto.prototype, "ruleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScoreRecordBatchDto.prototype, "remark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: terminal_source_enum_1.TerminalSourceDto }),
    (0, class_validator_1.IsEnum)(terminal_source_enum_1.TerminalSourceDto),
    __metadata("design:type", String)
], ScoreRecordBatchDto.prototype, "sourceTerminal", void 0);
//# sourceMappingURL=score-record-batch.dto.js.map