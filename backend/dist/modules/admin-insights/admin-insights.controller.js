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
exports.AdminInsightsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const admin_insights_service_1 = require("./admin-insights.service");
const pet_upsert_dto_1 = require("./dto/pet-upsert.dto");
let AdminInsightsController = class AdminInsightsController {
    constructor(adminInsightsService) {
        this.adminInsightsService = adminInsightsService;
    }
    analytics(authorization, gradeName, classId, regenerateAi) {
        return this.adminInsightsService.analytics(authorization, {
            gradeName,
            classId: classId ? Number(classId) : undefined,
            regenerateAi: regenerateAi === 'true',
        });
    }
    analyticsReportStatus(authorization, classId, gradeName) {
        return this.adminInsightsService.analyticsReportStatus(authorization, classId ? Number(classId) : undefined, gradeName);
    }
    pets(authorization, category) {
        return this.adminInsightsService.listPets(authorization, category);
    }
    createPet(authorization, body) {
        return this.adminInsightsService.createPet(authorization, body);
    }
    uploadPetAsset(authorization, file) {
        return this.adminInsightsService.uploadPetAsset(authorization, file);
    }
    updatePet(authorization, id, body) {
        return this.adminInsightsService.updatePet(authorization, Number(id), body);
    }
    updatePetStatus(authorization, id, status) {
        return this.adminInsightsService.updatePetStatus(authorization, Number(id), status);
    }
    deletePet(authorization, id) {
        return this.adminInsightsService.deletePet(authorization, Number(id));
    }
};
exports.AdminInsightsController = AdminInsightsController;
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('gradeName')),
    __param(2, (0, common_1.Query)('classId')),
    __param(3, (0, common_1.Query)('regenerateAi')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminInsightsController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)('analytics/report-status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('classId')),
    __param(2, (0, common_1.Query)('gradeName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AdminInsightsController.prototype, "analyticsReportStatus", null);
__decorate([
    (0, common_1.Get)('pets'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminInsightsController.prototype, "pets", null);
__decorate([
    (0, common_1.Post)('pets'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pet_upsert_dto_1.PetUpsertDto]),
    __metadata("design:returntype", void 0)
], AdminInsightsController.prototype, "createPet", null);
__decorate([
    (0, common_1.Post)('pets/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminInsightsController.prototype, "uploadPetAsset", null);
__decorate([
    (0, common_1.Put)('pets/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pet_upsert_dto_1.PetUpsertDto]),
    __metadata("design:returntype", void 0)
], AdminInsightsController.prototype, "updatePet", null);
__decorate([
    (0, common_1.Put)('pets/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AdminInsightsController.prototype, "updatePetStatus", null);
__decorate([
    (0, common_1.Delete)('pets/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminInsightsController.prototype, "deletePet", null);
exports.AdminInsightsController = AdminInsightsController = __decorate([
    (0, swagger_1.ApiTags)('AdminInsights'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_insights_service_1.AdminInsightsService])
], AdminInsightsController);
//# sourceMappingURL=admin-insights.controller.js.map