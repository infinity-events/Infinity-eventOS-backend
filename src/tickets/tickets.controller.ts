import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import {  } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('tickets')
export class TicketsController {

constructor(
private ticketsService:TicketsService
){}


@Get('stats/:festivalId')
stats(
@Param('festivalId') festivalId:string
){
return this.ticketsService.stats(festivalId);
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

return this.ticketsService.purchase(
categoryId,
req.user.id
);

}


@Get(':festivalId')
findAll(
@Param('festivalId') festivalId:string
){
return this.ticketsService.findAll(festivalId);
}

@UseGuards(FirebaseAuthGuard)
@Get('user/me')
getMyTickets(
@Req() req:any
){

return this.ticketsService.findUserTickets(
req.user.uid
);

}

}