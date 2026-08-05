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

async create(dto:CreateTicketDto){

const quantity=dto.quantity ?? 1;

const tickets:Prisma.TicketCreateManyInput[]=[];

for(let i=0;i<quantity;i++){

tickets.push({
code:this.generateTicketCode(),
type:dto.type ?? TicketType.STANDARD,
price:dto.price,
status:TicketStatus.GENERATED,
festivalId:dto.festivalId
});

}

return this.prisma.ticket.createMany({
data:tickets
});

}

findAll(festivalId:string){

return this.prisma.ticket.findMany({

where:{
festivalId
},

include:{
user:true,
wristband:true
}

});

}

async stats(festivalId:string){

const tickets=await this.prisma.ticket.findMany({

where:{
festivalId
}

});


const grouped={};


tickets.forEach(ticket=>{

if(!grouped[ticket.type]){

grouped[ticket.type]={
quantity:0,
revenue:0
};

}


grouped[ticket.type].quantity++;

grouped[ticket.type].revenue+=ticket.price;

});


return {

total:tickets.length,

revenue:tickets.reduce(
(sum,t)=>sum+t.price,
0
),

categories:grouped

};

}

async purchase(
categoryId:string,
userId:string
){

const category =
await this.prisma.ticketCategory.findUnique({
where:{
id:categoryId
}
});


if(!category){
throw new Error("Categoria non trovata");
}


if(category.sold >= category.quantity){
throw new Error("Biglietti esauriti");
}

const user = await this.prisma.user.findUnique({
    where:{
        firebaseUid:userId
    }
});

if(!user){
    throw new Error("Utente non registrato nel database");
}

const ticket =
await this.prisma.ticket.create({

data:{

code:this.generateTicketCode(),

type:category.type,

price:category.price,

status:TicketStatus.GENERATED,

festivalId:category.festivalId,

categoryId:category.id,

userId:user.id

}

});


await this.prisma.ticketCategory.update({

where:{
id:category.id
},

data:{
sold:{
increment:1
}
}

});


return ticket;

}

async findUserTickets(userId:string){

return this.prisma.ticket.findMany({

where:{
userId
},

include:{
festival:true,
wristband:true,
category:true

},

orderBy:{
createdAt:"desc"
}

});

}

}