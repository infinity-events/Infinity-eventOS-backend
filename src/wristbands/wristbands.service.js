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
exports.WristbandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WristbandsService = class WristbandsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateCode(prefix) {
        return prefix + "-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();
    }
    create(dto) {
        return this.prisma.wristband.create({
            data: {
                code: this.generateCode("WB"),
                activationCode: this.generateCode("ACT"),
                activated: false,
                ticket: {
                    connect: {
                        id: dto.ticketId
                    }
                },
                festival: {
                    connect: {
                        id: dto.festivalId
                    }
                }
            }
        });
    }
    async activate(dto) {
        const wristband = await this.prisma.wristband.findUnique({
            where: {
                code: dto.code
            }
        });
        console.log("USER ID RICEVUTO:", dto.userId);
        const user = await this.prisma.user.findUnique({
            where: {
                id: dto.userId
            }
        });
        console.log("USER TROVATO:", user);
        if (!wristband) {
            throw new Error("Bracciale non trovato");
        }
        if (wristband.activationCode !== dto.activationCode) {
            throw new Error("Codice di attivazione errato");
        }
        if (wristband.activated) {
            throw new Error("Bracciale già attivato");
        }
        return this.prisma.wristband.update({
            where: {
                id: wristband.id
            },
            data: {
                activated: true,
                user: {
                    connect: {
                        id: dto.userId
                    }
                }
            }
        });
    }
    async findByCode(code) {
        return this.prisma.wristband.findUnique({
            where: {
                activationCode: code
            },
            include: {
                user: {
                    include: {
                        wallet: true
                    }
                },
                ticket: true
            }
        });
    }
    async register(dto) {
        const existing = await this.prisma.wristband.findUnique({
            where: {
                id: dto.uid
            }
        });
        if (existing) {
            throw new Error("Braccialetto già registrato");
        }
        console.log("REGISTER UID:", dto.uid);
        const activationCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
        return this.prisma.wristband.create({
            data: {
                code: `WB-${Math.random()
                    .toString(36)
                    .substring(2, 8)
                    .toUpperCase()}`,
                id: dto.uid,
                activationCode
            }
        });
    }
};
exports.WristbandsService = WristbandsService;
exports.WristbandsService = WristbandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WristbandsService);
//# sourceMappingURL=wristbands.service.js.map