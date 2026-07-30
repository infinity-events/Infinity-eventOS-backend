import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TicketCategoryService } from './ticket-category.service';
import { TicketCategoryController } from './ticket-category.controller';

@Module({
imports:[PrismaModule],
controllers:[TicketCategoryController],
providers:[TicketCategoryService],
})
export class TicketCategoryModule {}