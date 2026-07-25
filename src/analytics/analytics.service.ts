import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

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

const wallets=await this.prisma.wallet.findMany({

where:{
user:{
wristbands:{
some:{
festivalId
}
}
}
},

include:{
transactions:true
}

});

let topups=0;
let spent=0;

wallets.forEach(wallet=>{
wallet.transactions.forEach(transaction=>{

if(transaction.type==="TOPUP"){
topups+=transaction.amount;
}

if(transaction.type==="PURCHASE"){
spent+=transaction.amount;
}
});
});

const ticketCategories={};
tickets.forEach(ticket=>{
    if(!ticketCategories[ticket.type]){
    ticketCategories[ticket.type]=0;
}

ticketCategories[ticket.type]++;

});

return {

tickets:{
sold:tickets.length,
revenue:tickets.reduce(
(sum,ticket)=>sum+ticket.price,
0
),
categories:ticketCategories
},

wristbands:{
total:wristbands.length,
activated:wristbands.filter(
w=>w.activated
).length

},

wallet:{

topups,

spent

},
event:{
users:wallets.length
}
};
}
}