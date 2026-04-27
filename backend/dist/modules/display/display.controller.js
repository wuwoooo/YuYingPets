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
exports.DisplayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const display_unlock_dto_1 = require("./dto/display-unlock.dto");
const display_service_1 = require("./display.service");
const display_lock_dto_1 = require("./dto/display-lock.dto");
const display_terminal_initialize_dto_1 = require("./dto/display-terminal-initialize.dto");
const display_weather_query_dto_1 = require("./dto/display-weather-query.dto");
let DisplayController = class DisplayController {
    constructor(displayService) {
        this.displayService = displayService;
    }
    terminalState(terminalCode) {
        return this.displayService.terminalState(terminalCode);
    }
    terminals(authorization) {
        return this.displayService.terminals(authorization);
    }
    terminalInitialize(authorization, dto) {
        return this.displayService.terminalInitialize(authorization, dto);
    }
    unlock(authorization, dto) {
        return this.displayService.unlock(authorization, dto);
    }
    unlockStatus(classId, code) {
        return this.displayService.unlockStatus(Number(classId), code);
    }
    lock(authorization, dto) {
        return this.displayService.lock(authorization, dto);
    }
    entryConfig(classId) {
        return this.displayService.entryConfig(classId ? Number(classId) : undefined);
    }
    weather(query) {
        return this.displayService.weather(query);
    }
    petCatalog() {
        return this.displayService.petCatalog();
    }
    home(classId) {
        return this.displayService.home(Number(classId));
    }
    leaderboard(classId, type) {
        return this.displayService.leaderboard(Number(classId), type);
    }
    rewardCenter(classId) {
        return this.displayService.rewardCenter(Number(classId));
    }
};
exports.DisplayController = DisplayController;
__decorate([
    (0, common_1.Get)('terminal-state'),
    __param(0, (0, common_1.Query)('terminalCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "terminalState", null);
__decorate([
    (0, common_1.Get)('terminals'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "terminals", null);
__decorate([
    (0, common_1.Post)('terminal-initialize'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, display_terminal_initialize_dto_1.DisplayTerminalInitializeDto]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "terminalInitialize", null);
__decorate([
    (0, common_1.Post)('unlock'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, display_unlock_dto_1.DisplayUnlockDto]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "unlock", null);
__decorate([
    (0, common_1.Get)('unlock-status'),
    __param(0, (0, common_1.Query)('classId')),
    __param(1, (0, common_1.Query)('displayTerminalCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "unlockStatus", null);
__decorate([
    (0, common_1.Post)('lock'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, display_lock_dto_1.DisplayLockDto]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "lock", null);
__decorate([
    (0, common_1.Get)('entry-config'),
    __param(0, (0, common_1.Query)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "entryConfig", null);
__decorate([
    (0, common_1.Get)('weather'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [display_weather_query_dto_1.DisplayWeatherQueryDto]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "weather", null);
__decorate([
    (0, common_1.Get)('pet-catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "petCatalog", null);
__decorate([
    (0, common_1.Get)('classes/:classId/home'),
    __param(0, (0, common_1.Param)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "home", null);
__decorate([
    (0, common_1.Get)('classes/:classId/leaderboard'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "leaderboard", null);
__decorate([
    (0, common_1.Get)('classes/:classId/reward-center'),
    __param(0, (0, common_1.Param)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "rewardCenter", null);
exports.DisplayController = DisplayController = __decorate([
    (0, swagger_1.ApiTags)('Display'),
    (0, common_1.Controller)('display'),
    __metadata("design:paramtypes", [display_service_1.DisplayService])
], DisplayController);
//# sourceMappingURL=display.controller.js.map