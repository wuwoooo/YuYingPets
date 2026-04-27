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
exports.AdminConfigController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_config_service_1 = require("./admin-config.service");
const school_settings_update_dto_1 = require("./dto/school-settings-update.dto");
const semester_settings_update_dto_1 = require("./dto/semester-settings-update.dto");
const display_settings_update_dto_1 = require("./dto/display-settings-update.dto");
const grade_settings_update_dto_1 = require("./dto/grade-settings-update.dto");
const pet_growth_settings_update_dto_1 = require("./dto/pet-growth-settings-update.dto");
const permission_user_upsert_dto_1 = require("./dto/permission-user-upsert.dto");
const permission_user_status_update_dto_1 = require("./dto/permission-user-status-update.dto");
let AdminConfigController = class AdminConfigController {
    constructor(adminConfigService) {
        this.adminConfigService = adminConfigService;
    }
    settings(authorization) {
        return this.adminConfigService.getSettings(authorization);
    }
    updateSchool(authorization, body) {
        return this.adminConfigService.updateSchool(authorization, body);
    }
    updateSemester(authorization, body) {
        return this.adminConfigService.updateSemester(authorization, body);
    }
    updateDisplay(authorization, body) {
        return this.adminConfigService.updateDisplay(authorization, body);
    }
    updateGrades(authorization, body) {
        return this.adminConfigService.updateGrades(authorization, body);
    }
    updatePetGrowth(authorization, body) {
        return this.adminConfigService.updatePetGrowth(authorization, body);
    }
    roles(authorization) {
        return this.adminConfigService.listRoleTemplates(authorization);
    }
    users(authorization) {
        return this.adminConfigService.listPermissionUsers(authorization);
    }
    createUser(authorization, body) {
        return this.adminConfigService.createPermissionUser(authorization, body);
    }
    updateUser(authorization, id, body) {
        return this.adminConfigService.updatePermissionUser(authorization, Number(id), body);
    }
    resetPassword(authorization, id) {
        return this.adminConfigService.resetPassword(authorization, Number(id));
    }
    updateUserStatus(authorization, id, body) {
        return this.adminConfigService.updatePermissionUserStatus(authorization, Number(id), body.status);
    }
};
exports.AdminConfigController = AdminConfigController;
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "settings", null);
__decorate([
    (0, common_1.Put)('settings/school'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, school_settings_update_dto_1.SchoolSettingsUpdateDto]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "updateSchool", null);
__decorate([
    (0, common_1.Put)('settings/semester'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, semester_settings_update_dto_1.SemesterSettingsUpdateDto]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "updateSemester", null);
__decorate([
    (0, common_1.Put)('settings/display'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, display_settings_update_dto_1.DisplaySettingsUpdateDto]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "updateDisplay", null);
__decorate([
    (0, common_1.Put)('settings/grades'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, grade_settings_update_dto_1.GradeSettingsUpdateDto]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "updateGrades", null);
__decorate([
    (0, common_1.Put)('settings/pet-growth'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pet_growth_settings_update_dto_1.PetGrowthSettingsUpdateDto]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "updatePetGrowth", null);
__decorate([
    (0, common_1.Get)('permissions/roles'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "roles", null);
__decorate([
    (0, common_1.Get)('permissions/users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "users", null);
__decorate([
    (0, common_1.Post)('permissions/users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, permission_user_upsert_dto_1.PermissionUserUpsertDto]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('permissions/users/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, permission_user_upsert_dto_1.PermissionUserUpsertDto]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Post)('permissions/users/:id/reset-password'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Put)('permissions/users/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, permission_user_status_update_dto_1.PermissionUserStatusUpdateDto]),
    __metadata("design:returntype", void 0)
], AdminConfigController.prototype, "updateUserStatus", null);
exports.AdminConfigController = AdminConfigController = __decorate([
    (0, swagger_1.ApiTags)('AdminConfig'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_config_service_1.AdminConfigService])
], AdminConfigController);
//# sourceMappingURL=admin-config.controller.js.map