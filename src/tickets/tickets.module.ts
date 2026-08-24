import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StripeModule } from '../stripe/stripe.module';
import { TicketMailService } from './ticket-mail.service';


@Module({
  imports:[
    PrismaModule,
    AuthModule
    ,StripeModule
  ],
  controllers:[
    TicketsController
  ],
  providers:[
    TicketsService,
    TicketMailService
  ],
  exports: [
    TicketsService,
    TicketMailService,
  ],
})
export class TicketsModule {}
