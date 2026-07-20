import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';


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




create(dto: CreateTicketDto) {

    console.log(dto);

  return this.prisma.ticket.create({

    data: {

      code: this.generateTicketCode(),

      type: "STANDARD",

      price: 10,

      status: "GENERATED",

      festival: {
        connect: {
          id: dto.festivalId
        }
      },

      user: dto.userId
        ? {
            connect: {
              id: dto.userId
            }
          }
        : undefined

    }

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