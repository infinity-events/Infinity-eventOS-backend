import { Controller, Post, Body, Get } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';



@Controller('tickets')
export class TicketsController {


constructor(
    private ticketsService:TicketsService
){}



@Post()
create(
    @Body() dto:CreateTicketDto
){

    return this.ticketsService.create(dto);

}



@Get()
findAll(){

    return this.ticketsService.findAll();

}


}