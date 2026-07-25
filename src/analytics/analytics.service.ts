import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class AnalyticsService{


constructor(
private prisma:PrismaService
){}



async getAnalytics(festivalId:string){


const tickets=await this.prisma.ticket.findMany({

where:{
festivalId
}

});



const wristbands=await this.prisma.wristband.findMany({

where:{
festivalId
}

});



const transactions=await this.prisma.transaction.findMany({

where:{
wallet:{
user:{
tickets:{
some:{
festivalId
}
}
}
}
}

});



const ticketCategories={};


tickets.forEach(ticket=>{


if(!ticketCategories[ticket.type]){

ticketCategories[ticket.type]=0;

}


ticketCategories[ticket.type]++;


});



const revenue=tickets.reduce(
(sum,ticket)=>sum+ticket.price,
0
);



const walletTopup=transactions
.filter(t=>t.type==="TOPUP")
.reduce(
(sum,t)=>sum+t.amount,
0
);



const walletSpent=transactions
.filter(t=>t.type==="PURCHASE")
.reduce(
(sum,t)=>sum+t.amount,
0
);



return {


tickets:{

sold:tickets.length,

revenue,

categories:ticketCategories

},



wristbands:{

total:wristbands.length,

activated:wristbands.filter(
w=>w.activated
).length

},



wallet:{

topups:walletTopup,

spent:walletSpent

}



};


}


}