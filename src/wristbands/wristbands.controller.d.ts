import { WristbandsService } from './wristbands.service';
import { CreateWristbandDto } from './dto/create-wristband.dto';
import { ActivateWristbandDto } from './dto/activate-wristband.dto';
import { RegisterWristbandDto } from './dto/register-wristband.dto';
export declare class WristbandsController {
    private service;
    constructor(service: WristbandsService);
    findByCode(code: string): Promise<({
        ticket: {
            id: string;
            createdAt: Date;
            code: string;
            type: import("@prisma/client").$Enums.TicketType;
            price: number;
            status: import("@prisma/client").$Enums.TicketStatus;
            festivalId: string;
            userId: string | null;
        } | null;
        user: ({
            wallet: {
                id: string;
                balance: number;
                userId: string;
            } | null;
        } & {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        code: string;
        festivalId: string | null;
        userId: string | null;
        activationCode: string;
        activated: boolean;
        ticketId: string | null;
    }) | null>;
    create(dto: CreateWristbandDto): import("@prisma/client").Prisma.Prisma__WristbandClient<{
        id: string;
        createdAt: Date;
        code: string;
        festivalId: string | null;
        userId: string | null;
        activationCode: string;
        activated: boolean;
        ticketId: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    activate(dto: ActivateWristbandDto): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        festivalId: string | null;
        userId: string | null;
        activationCode: string;
        activated: boolean;
        ticketId: string | null;
    }>;
    register(dto: RegisterWristbandDto): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        festivalId: string | null;
        userId: string | null;
        activationCode: string;
        activated: boolean;
        ticketId: string | null;
    }>;
}
