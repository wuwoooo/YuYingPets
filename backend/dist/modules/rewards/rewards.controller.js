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
exports.RewardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const rewards_service_1 = require("./rewards.service");
const reward_upsert_dto_1 = require("./dto/reward-upsert.dto");
const reward_order_create_dto_1 = require("./dto/reward-order-create.dto");
let RewardsController = class RewardsController {
    constructor(rewardsService) {
        this.rewardsService = rewardsService;
    }
    list(authorization, query) {
        return this.rewardsService.list(authorization, query);
    }
    create(authorization, body) {
        return this.rewardsService.create(authorization, body);
    }
    update(authorization, id, body) {
        return this.rewardsService.update(authorization, Number(id), body);
    }
    uploadRewardAsset(authorization, file) {
        return this.rewardsService.uploadRewardAsset(authorization, file);
    }
    updateStatus(authorization, id, status) {
        return this.rewardsService.updateStatus(authorization, Number(id), status);
    }
    deleteReward(authorization, id) {
        return this.rewardsService.deleteReward(authorization, Number(id));
    }
    orders(authorization, query) {
        return this.rewardsService.orders(authorization, query);
    }
    createOrder(authorization, body) {
        return this.rewardsService.createOrder(authorization, body);
    }
};
exports.RewardsController = RewardsController;
__decorate([
    (0, common_1.Get)('rewards'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('rewards'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reward_upsert_dto_1.RewardUpsertDto]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('rewards/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reward_upsert_dto_1.RewardUpsertDto]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('rewards/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "uploadRewardAsset", null);
__decorate([
    (0, common_1.Put)('rewards/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)('rewards/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "deleteReward", null);
__decorate([
    (0, common_1.Get)('reward-orders'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "orders", null);
__decorate([
    (0, common_1.Post)('reward-orders'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reward_order_create_dto_1.RewardOrderCreateDto]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "createOrder", null);
exports.RewardsController = RewardsController = __decorate([
    (0, swagger_1.ApiTags)('Rewards'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [rewards_service_1.RewardsService])
], RewardsController);
//# sourceMappingURL=rewards.controller.js.map