import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import {Prisma, TicketType, TicketStatus} from '@prisma/client';


@Injectable()
export class TicketsService {


constructor(
    private prisma: PrismaService
){}



private generateTicketCode(){

    const random = Math.random()
        .toString(36)
        .substring(2,8)
        .toUpperCase();


    const year = new Date()
        .getFullYear();


    return `VF-${year}-${random}`;

}


create(dto:CreateTicketDto){

const tickets:Prisma.TicketCreateManyInput[]=[];

for(let i=0;i<dto.quantity;i++){

tickets.push({

code:this.generateTicketCode(),

type:(dto.type as TicketType)||TicketType.STANDARD,

price:dto.price,

status:TicketStatus.GENERATED,

festivalId:dto.festivalId

});

}


return this.prisma.ticket.createMany({

data:tickets

});

}


findAll(){

    return this.prisma.ticket.findMany({
        include:{
            user:true,
            festival:true,
            wristband:true
        }
    });

}


}