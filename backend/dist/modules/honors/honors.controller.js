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
exports.HonorsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const honors_service_1 = require("./honors.service");
const honor_upsert_dto_1 = require("./dto/honor-upsert.dto");
const honor_record_create_dto_1 = require("./dto/honor-record-create.dto");
let HonorsController = class HonorsController {
    constructor(honorsService) {
        this.honorsService = honorsService;
    }
    list(authorization, query) {
        return this.honorsService.list(authorization, query);
    }
    create(authorization, body) {
        return this.honorsService.create(authorization, body);
    }
    update(authorization, id, body) {
        return this.honorsService.update(authorization, Number(id), body);
    }
    uploadHonorAsset(authorization, file) {
        return this.honorsService.uploadHonorAsset(authorization, file);
    }
    updateStatus(authorization, id, status) {
        return this.honorsService.updateStatus(authorization, Number(id), status);
    }
    records(authorization, query) {
        return this.honorsService.records(authorization, query);
    }
    createRecord(authorization, body) {
        return this.honorsService.createRecord(authorization, body);
    }
};
exports.HonorsController = HonorsController;
__decorate([
    (0, common_1.Get)('honors'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HonorsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('honors'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, honor_upsert_dto_1.HonorUpsertDto]),
    __metadata("design:returntype", void 0)
], HonorsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('honors/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, honor_upsert_dto_1.HonorUpsertDto]),
    __metadata("design:returntype", void 0)
], HonorsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('honors/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HonorsController.prototype, "uploadHonorAsset", null);
__decorate([
    (0, common_1.Put)('honors/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], HonorsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('honor-records'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HonorsController.prototype, "records", null);
__decorate([
    (0, common_1.Post)('honor-records'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, honor_record_create_dto_1.HonorRecordCreateDto]),
    __metadata("design:returntype", void 0)
], HonorsController.prototype, "createRecord", null);
exports.HonorsController = HonorsController = __decorate([
    (0, swagger_1.ApiTags)('Honors'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [honors_service_1.HonorsService])
], HonorsController);
//# sourceMappingURL=honors.controller.js.map