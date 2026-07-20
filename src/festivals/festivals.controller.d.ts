import { FestivalsService } from './festivals.service';
import { CreateFestivalDto } from './dto/create-festival.dto';
export declare class FestivalsController {
    private festivalsService;
    constructor(festivalsService: FestivalsService);
    create(dto: CreateFestivalDto): import("@prisma/client").Prisma.Prisma__FestivalClient<{
        id: string;
        name: string;
        location: string;
        startDate: Date;
        endDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        location: string;
        startDate: Date;
        endDate: Date;
    }[]>;
}
