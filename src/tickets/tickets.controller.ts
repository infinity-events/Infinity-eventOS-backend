import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

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


@Post('purchase/:categoryId')
purchase(
@Param('categoryId') categoryId:string,
@Req() req:any
){

console.log("USER:", req.user);

return this.ticketsService.purchase(
categoryId,
req.user.uid
);

}


@Get(':festivalId')
findAll(
@Param('festivalId') festivalId:string
){
return this.ticketsService.findAll(festivalId);
}

@Get('user/me')
getMyTickets(
@Req() req:any
){

return this.ticketsService.findUserTickets(
req.user.uid
);

}

}