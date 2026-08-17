import { Controller, Get, Headers, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { StripeService } from './stripe.service';

@Controller('festivals/:festivalId/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post('connect')
  connect(@Param('festivalId') festivalId: string, @Req() req: any) {
    return this.stripeService.createConnectLink(festivalId, req.user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('status')
  status(@Param('festivalId') festivalId: string, @Req() req: any) {
    return this.stripeService.getStatus(festivalId, req.user.id);
  }

  @Get('refresh')
  async refresh(@Param('festivalId') festivalId: string, @Res() response: Response) {
    response.redirect(await this.stripeService.refreshConnectLink(festivalId));
  }
}

@Controller('stripe')
export class StripeWebhookController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('webhook')
  webhook(@Req() request: any, @Headers('stripe-signature') signature: string) {
    return this.stripeService.handleWebhook(request.rawBody, signature);
  }
}
