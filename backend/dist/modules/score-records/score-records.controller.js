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
exports.ScoreRecordsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const score_records_service_1 = require("./score-records.service");
const score_record_create_dto_1 = require("./dto/score-record-create.dto");
const score_record_batch_dto_1 = require("./dto/score-record-batch.dto");
const score_record_group_dto_1 = require("./dto/score-record-group.dto");
let ScoreRecordsController = class ScoreRecordsController {
    constructor(scoreRecordsService) {
        this.scoreRecordsService = scoreRecordsService;
    }
    list(query) {
        return this.scoreRecordsService.list(query);
    }
    create(authorization, body) {
        return this.scoreRecordsService.create(authorization, body);
    }
    batch(authorization, body) {
        return this.scoreRecordsService.batch(authorization, body);
    }
    group(authorization, body) {
        return this.scoreRecordsService.group(authorization, body);
    }
    reverse(id) {
        return this.scoreRecordsService.reverse(Number(id));
    }
};
exports.ScoreRecordsController = ScoreRecordsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScoreRecordsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, score_record_create_dto_1.ScoreRecordCreateDto]),
    __metadata("design:returntype", void 0)
], ScoreRecordsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('batch'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, score_record_batch_dto_1.ScoreRecordBatchDto]),
    __metadata("design:returntype", void 0)
], ScoreRecordsController.prototype, "batch", null);
__decorate([
    (0, common_1.Post)('group'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, score_record_group_dto_1.ScoreRecordGroupDto]),
    __metadata("design:returntype", void 0)
], ScoreRecordsController.prototype, "group", null);
__decorate([
    (0, common_1.Post)(':id/reverse'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScoreRecordsController.prototype, "reverse", null);
exports.ScoreRecordsController = ScoreRecordsController = __decorate([
    (0, swagger_1.ApiTags)('ScoreRecords'),
    (0, common_1.Controller)('score-records'),
    __metadata("design:paramtypes", [score_records_service_1.ScoreRecordsService])
], ScoreRecordsController);
//# sourceMappingURL=score-records.controller.js.map