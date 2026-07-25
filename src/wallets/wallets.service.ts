import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { PayWristbandDto } from './dto/pay-wristband.dto';
import { PayDto } from './dto/pay.dto';

@Injectable()
export class WalletsService{

constructor(private prisma:PrismaService){}

async topup(dto:TopupWalletDto){

const wristband=await this.prisma.wristband.findUnique({
where:{code:dto.wristbandCode},
include:{
user:{
include:{
wallet:true
}
}
}
});

if(!wristband)throw new Error("Bracciale non trovato");

if(!wristband.user?.wallet)throw new Error("Wallet non trovato");

const wallet=wristband.user.wallet;

return this.prisma.wallet.update({
where:{id:wallet.id},
data:{
balance:{
increment:dto.amount
},
transactions:{
create:{
amount:dto.amount,
type:"TOPUP",
description:"Ricarica wallet",
wristbandId:wristband.id
}
}
}
});

}

async pay(dto:PayDto){

const wristband=await this.prisma.wristband.findUnique({
where:{code:dto.wristbandCode},
include:{
user:{
include:{
wallet:true
}
}
}
});

if(!wristband)throw new Error("Bracciale non trovato");
if(!wristband.user?.wallet)throw new Error("Wallet non trovato");

const wallet=wristband.user.wallet;

if(wallet.balance<dto.amount)throw new Error("Saldo insufficiente");

return this.prisma.wallet.update({
where:{id:wallet.id},
data:{
balance:{decrement:dto.amount},
transactions:{
create:{
amount:dto.amount,
type:"PURCHASE",
description:dto.description
}
}
}
});

}

async payByWristband(dto:PayWristbandDto){

const wristband=await this.prisma.wristband.findUnique({
where:{code:dto.wristbandCode},
include:{
user:{
include:{
wallet:true
}
}
}
});

if(!wristband?.user?.wallet)throw new Error("Bracciale non associato");

const wallet=wristband.user.wallet;

if(wallet.balance<dto.amount)throw new Error("Saldo insufficiente");

return this.prisma.wallet.update({
where:{id:wallet.id},
data:{
balance:{decrement:dto.amount},
transactions:{
create:{
amount:dto.amount,
type:"PURCHASE",
description:dto.description
}
}
}
});

}

async findWallet(userId:string){

return this.prisma.wallet.findUnique({
where:{userId},
include:{
user:true,
transactions:{
orderBy:{createdAt:"desc"}
}
}
});

}

async stats(festivalId:string){

const wallets=await this.prisma.wallet.findMany({
where:{
user:{
wristbands:{
some:{festivalId}
}
}
},
include:{transactions:true}
});

let balance=0;
let topup=0;
let spent=0;

wallets.forEach(wallet=>{
balance+=wallet.balance;
wallet.transactions.forEach(t=>{
if(t.type==="TOPUP")topup+=t.amount;
if(t.type==="PURCHASE")spent+=t.amount;
});
});

return{
wallets:wallets.length,
balance,
topup,
spent
};

}

async transactions(userId:string){

const wallet=await this.prisma.wallet.findUnique({
where:{
userId
}
});

if(!wallet){
throw new Error("Wallet non trovato");
}
return this.prisma.transaction.findMany({
where:{
walletId:wallet.id
},

orderBy:{
createdAt:"desc"
},

take:50

});

}

}