import { Controller, Post, Body, Get, Param } from '@nestjs/common';
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


@Get(':festivalId')
findAll(
@Param('festivalId') festivalId:string
){

return this.ticketsService.findAll(festivalId);

}

}