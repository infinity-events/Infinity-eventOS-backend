import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StripeModule } from '../stripe/stripe.module';


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
    TicketsService
  ]
})
export class TicketsModule {}
