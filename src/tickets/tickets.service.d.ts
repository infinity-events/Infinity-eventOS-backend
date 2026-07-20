import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
export declare class TicketsService {
    private prisma;
    constructor(prisma: PrismaService);
    private generateTicketCode;
    create(dto: CreateTicketDto): import("@prisma/client").Prisma.Prisma__TicketClient<{
        id: string;
        createdAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.TicketType;
        price: number;
        status: import("@prisma/client").$Enums.TicketStatus;
        festivalId: string;
        userId: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        festival: {
            id: string;
            name: string;
            location: string;
            startDate: Date;
            endDate: Date;
        };
        wristband: {
            id: string;
            createdAt: Date;
            code: string;
            festivalId: string | null;
            userId: string | null;
            activationCode: string;
            activated: boolean;
            ticketId: string | null;
        } | null;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.TicketType;
        price: number;
        status: import("@prisma/client").$Enums.TicketStatus;
        festivalId: string;
        userId: string | null;
    })[]>;
}
