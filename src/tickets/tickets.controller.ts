import { BadRequestException, Controller, Post, Body, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { StripeService } from '../stripe/stripe.service';

@Controller('tickets')
export class TicketsController {

constructor(
private ticketsService:TicketsService,
private stripeService: StripeService
){}


@Get('stats/:festivalId')
stats(
@Param('festivalId') festivalId:string
){
return this.ticketsService.stats(festivalId);
}

@UseGuards(FirebaseAuthGuard)
@Post('checkout/:categoryId')
checkout(@Param('categoryId') categoryId: string, @Req() req: any) {
  return this.stripeService.createCheckout(categoryId, req.user.id);
}

@UseGuards(FirebaseAuthGuard)
@Get('checkout/verify')
verifyCheckout(@Query('session_id') sessionId: string, @Req() req: any) {
  return this.stripeService.verifyCheckout(sessionId, req.user.id);
}


@Post()
create(
@Body() dto:CreateTicketDto
){
return this.ticketsService.create(dto);
}

@UseGuards(FirebaseAuthGuard)
@Post('purchase/:categoryId')
purchase(
@Param('categoryId') categoryId:string,
@Req() req:any
){

console.log("USER DAL GUARD:", req.user);

 throw new BadRequestException('Usa il checkout Stripe per acquistare un biglietto');

}


@Get(':festivalId')
findAll(
@Param('festivalId') festivalId:string
){
return this.ticketsService.findAll(festivalId);
}


@Get('user/me')
@UseGuards(FirebaseAuthGuard)
async getMyTickets(
@Req() req:any
){

await this.stripeService.reconcilePendingTickets(req.user.id);

return this.ticketsService.findUserTickets(
req.user.firebaseUid
);

}

}
