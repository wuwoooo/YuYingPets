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
exports.ScoreRulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const score_rules_service_1 = require("./score-rules.service");
const score_rule_upsert_dto_1 = require("./dto/score-rule-upsert.dto");
const score_rule_ai_suggest_dto_1 = require("./dto/score-rule-ai-suggest.dto");
let ScoreRulesController = class ScoreRulesController {
    constructor(scoreRulesService) {
        this.scoreRulesService = scoreRulesService;
    }
    list(authorization, query) {
        return this.scoreRulesService.list(authorization, query);
    }
    tree(query) {
        return this.scoreRulesService.tree(query);
    }
    create(authorization, body) {
        return this.scoreRulesService.create(authorization, body);
    }
    aiSuggest(authorization, body) {
        return this.scoreRulesService.aiSuggest(authorization, body);
    }
    detail(id) {
        return this.scoreRulesService.detail(Number(id));
    }
    update(authorization, id, body) {
        return this.scoreRulesService.update(authorization, Number(id), body);
    }
};
exports.ScoreRulesController = ScoreRulesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScoreRulesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('tree'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScoreRulesController.prototype, "tree", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, score_rule_upsert_dto_1.ScoreRuleUpsertDto]),
    __metadata("design:returntype", void 0)
], ScoreRulesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('ai-suggest'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, score_rule_ai_suggest_dto_1.ScoreRuleAiSuggestDto]),
    __metadata("design:returntype", void 0)
], ScoreRulesController.prototype, "aiSuggest", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScoreRulesController.prototype, "detail", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, score_rule_upsert_dto_1.ScoreRuleUpsertDto]),
    __metadata("design:returntype", void 0)
], ScoreRulesController.prototype, "update", null);
exports.ScoreRulesController = ScoreRulesController = __decorate([
    (0, swagger_1.ApiTags)('ScoreRules'),
    (0, common_1.Controller)('score-rules'),
    __metadata("design:paramtypes", [score_rules_service_1.ScoreRulesService])
], ScoreRulesController);
//# sourceMappingURL=score-rules.controller.js.map