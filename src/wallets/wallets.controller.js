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
exports.WalletsController = void 0;
const common_1 = require("@nestjs/common");
const wallets_service_1 = require("./wallets.service");
const topup_wallet_dto_1 = require("./dto/topup-wallet.dto");
const pay_wristband_dto_1 = require("./dto/pay-wristband.dto");
const pay_dto_1 = require("./dto/pay.dto");
let WalletsController = class WalletsController {
    walletsService;
    constructor(walletsService) {
        this.walletsService = walletsService;
    }
    topup(dto) {
        return this.walletsService.topup(dto);
    }
    payWristband(dto) {
        return this.walletsService.payByWristband(dto);
    }
    pay(dto) {
        return this.walletsService.pay(dto);
    }
};
exports.WalletsController = WalletsController;
__decorate([
    (0, common_1.Post)('topup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [topup_wallet_dto_1.TopupWalletDto]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "topup", null);
__decorate([
    (0, common_1.Post)('pay-wristband'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pay_wristband_dto_1.PayWristbandDto]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "payWristband", null);
__decorate([
    (0, common_1.Post)('pay'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pay_dto_1.PayDto]),
    __metadata("design:returntype", void 0)
], WalletsController.prototype, "pay", null);
exports.WalletsController = WalletsController = __decorate([
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallets_service_1.WalletsService])
], WalletsController);
//# sourceMappingURL=wallets.controller.js.map