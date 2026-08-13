import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { PayWristbandDto } from './dto/pay-wristband.dto';
import { PayDto } from './dto/pay.dto';

@Injectable()
export class WalletsService{

constructor(private prisma:PrismaService){}

private async getWristbandWallet(wristbandCode:string){
const code=wristbandCode?.trim().toUpperCase();
if(!code)throw new BadRequestException("Codice braccialetto obbligatorio");

const wristband=await this.prisma.wristband.findUnique({
where:{code},
include:{user:true}
});

if(!wristband)throw new NotFoundException("Braccialetto non trovato");
if(!wristband.userId)throw new BadRequestException("Braccialetto non associato a un utente");

const wallet=await this.prisma.wallet.upsert({
where:{userId:wristband.userId},
update:{},
create:{userId:wristband.userId,balance:0}
});

return {wristband,wallet};
}

private validateAmount(amount:number){
const value=Number(amount);
if(!Number.isFinite(value)||value<=0)throw new BadRequestException("L'importo deve essere maggiore di zero");
return value;
}

async topup(dto:TopupWalletDto){
const amount=this.validateAmount(dto.amount);
const {wristband,wallet}=await this.getWristbandWallet(dto.wristbandCode);

return this.prisma.wallet.update({
where:{id:wallet.id},
data:{
balance:{
increment:amount
},
transactions:{
create:{
amount,
type:"TOPUP",
description:"Ricarica wallet",
wristbandId:wristband.id
}
}
}
});

}

async pay(dto:PayDto){
const amount=this.validateAmount(dto.amount);
const {wristband,wallet}=await this.getWristbandWallet(dto.wristbandCode);

if(wallet.balance<amount)throw new BadRequestException("Saldo insufficiente");

return this.prisma.wallet.update({
where:{id:wallet.id},
data:{
balance:{decrement:amount},
transactions:{
create:{
amount,
type:"PURCHASE",
description:dto.description,
wristbandId:wristband.id
}
}
}
});

}

async payByWristband(dto:PayWristbandDto){
const amount=this.validateAmount(dto.amount);
const {wristband,wallet}=await this.getWristbandWallet(dto.wristbandCode);

if(wallet.balance<amount)throw new BadRequestException("Saldo insufficiente");

return this.prisma.wallet.update({
where:{id:wallet.id},
data:{
balance:{decrement:amount},
transactions:{
create:{
amount,
type:"PURCHASE",
description:dto.description,
wristbandId:wristband.id
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
