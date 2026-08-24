import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import {
  StripeController,
  StripeWebhookController,
} from './stripe.controller';

import { StripeService } from './stripe.service';
import { TicketMailService } from '../tickets/ticket-mail.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],

  controllers: [
    StripeController,
    StripeWebhookController,
  ],

  providers: [
    StripeService,
    TicketMailService,
  ],

  exports: [
    StripeService,
  ],
})
export class StripeModule {}