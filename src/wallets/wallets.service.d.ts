import { PrismaService } from '../prisma/prisma.service';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { PayWristbandDto } from './dto/pay-wristband.dto';
import { PayDto } from './dto/pay.dto';
export declare class WalletsService {
    private prisma;
    constructor(prisma: PrismaService);
    topup(dto: TopupWalletDto): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.TransactionType;
            amount: number;
            description: string | null;
            walletId: string;
        }[];
    } & {
        id: string;
        balance: number;
        userId: string;
    }>;
    pay(dto: PayDto): Promise<{
        id: string;
        balance: number;
        userId: string;
    }>;
    payByWristband(dto: PayWristbandDto): Promise<{
        id: string;
        balance: number;
        userId: string;
    }>;
}
