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
exports.WristbandsController = void 0;
const common_1 = require("@nestjs/common");
const wristbands_service_1 = require("./wristbands.service");
const create_wristband_dto_1 = require("./dto/create-wristband.dto");
const activate_wristband_dto_1 = require("./dto/activate-wristband.dto");
const register_wristband_dto_1 = require("./dto/register-wristband.dto");
let WristbandsController = class WristbandsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findByCode(code) {
        console.log("CODICE RICEVUTO:", code);
        return this.service.findByCode(code);
    }
    create(dto) {
        return this.service.create(dto);
    }
    activate(dto) {
        return this.service.activate(dto);
    }
    register(dto) {
        console.log("RICEVUTO:", dto);
        return this.service.register(dto);
    }
};
exports.WristbandsController = WristbandsController;
__decorate([
    (0, common_1.Get)('code/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WristbandsController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_wristband_dto_1.CreateWristbandDto]),
    __metadata("design:returntype", void 0)
], WristbandsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('activate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [activate_wristband_dto_1.ActivateWristbandDto]),
    __metadata("design:returntype", void 0)
], WristbandsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_wristband_dto_1.RegisterWristbandDto]),
    __metadata("design:returntype", void 0)
], WristbandsController.prototype, "register", null);
exports.WristbandsController = WristbandsController = __decorate([
    (0, common_1.Controller)('wristbands'),
    __metadata("design:paramtypes", [wristbands_service_1.WristbandsService])
], WristbandsController);
//# sourceMappingURL=wristbands.controller.js.map