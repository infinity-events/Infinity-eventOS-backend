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
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WalletsService = class WalletsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async topup(dto) {
        const wallet = await this.prisma.wallet.findUnique({
            where: {
                userId: dto.userId
            }
        });
        if (!wallet) {
            throw new Error("Wallet non trovato");
        }
        return this.prisma.wallet.update({
            where: {
                id: wallet.id
            },
            data: {
                balance: {
                    increment: dto.amount
                },
                transactions: {
                    create: {
                        amount: dto.amount,
                        type: "TOPUP",
                        description: "Ricarica wallet"
                    }
                }
            },
            include: {
                transactions: true
            }
        });
    }
    async pay(dto) {
        const wristband = await this.prisma.wristband.findUnique({
            where: {
                code: dto.wristbandCode
            },
            include: {
                user: {
                    include: {
                        wallet: true
                    }
                }
            }
        });
        if (!wristband) {
            throw new Error("Bracciale non trovato");
        }
        if (!wristband.user?.wallet) {
            throw new Error("Wallet non trovato");
        }
        const wallet = wristband.user.wallet;
        if (wallet.balance < dto.amount) {
            throw new Error("Saldo insufficiente");
        }
        return this.prisma.wallet.update({
            where: {
                id: wallet.id
            },
            data: {
                balance: {
                    decrement: dto.amount
                },
                transactions: {
                    create: {
                        amount: dto.amount,
                        type: "PURCHASE",
                        description: dto.description
                    }
                }
            }
        });
    }
    async payByWristband(dto) {
        const wristband = await this.prisma.wristband.findUnique({
            where: {
                code: dto.wristbandCode
            },
            include: {
                user: {
                    include: {
                        wallet: true
                    }
                }
            }
        });
        if (!wristband?.user?.wallet) {
            throw new Error("Bracciale non associato");
        }
        const wallet = wristband.user.wallet;
        if (wallet.balance < dto.amount) {
            throw new Error("Saldo insufficiente");
        }
        return this.prisma.wallet.update({
            where: {
                id: wallet.id
            },
            data: {
                balance: {
                    decrement: dto.amount
                },
                transactions: {
                    create: {
                        amount: dto.amount,
                        type: "PURCHASE",
                        description: dto.description
                    }
                }
            }
        });
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map