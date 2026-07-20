import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { PayWristbandDto } from './dto/pay-wristband.dto';
import { PayDto } from './dto/pay.dto';


@Injectable()
export class WalletsService {


constructor(
    private prisma:PrismaService
){}



// RICARICA

async topup(dto:TopupWalletDto){


const wallet = await this.prisma.wallet.findUnique({

where:{
    userId:dto.userId
}

});


if(!wallet){

throw new Error("Wallet non trovato");

}



return this.prisma.wallet.update({

where:{
    id:wallet.id
},


data:{

balance:{
    increment:dto.amount
},


transactions:{
    create:{
        amount:dto.amount,
        type:"TOPUP",
        description:"Ricarica wallet"
    }
}

},


include:{
    transactions:true
}

});


}



// PAGAMENTO




async pay(dto: PayDto){


  const wristband = await this.prisma.wristband.findUnique({

    where:{
      code:dto.wristbandCode
    },

    include:{
      user:{
        include:{
          wallet:true
        }
      }
    }

  });


  if(!wristband){
    throw new Error("Bracciale non trovato");
  }


  if(!wristband.user?.wallet){
    throw new Error("Wallet non trovato");
  }


  const wallet = wristband.user.wallet;


  if(wallet.balance < dto.amount){
    throw new Error("Saldo insufficiente");
  }


  return this.prisma.wallet.update({

    where:{
      id:wallet.id
    },

    data:{

      balance:{
        decrement:dto.amount
      },

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


const wristband = await this.prisma.wristband.findUnique({

where:{
    code:dto.wristbandCode
},

include:{
    user:{
        include:{
            wallet:true
        }
    }
}

});


if(!wristband?.user?.wallet){

throw new Error("Bracciale non associato");

}


const wallet=wristband.user.wallet;



if(wallet.balance < dto.amount){

throw new Error("Saldo insufficiente");

}



return this.prisma.wallet.update({

where:{
    id:wallet.id
},

data:{

balance:{
    decrement:dto.amount
},

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

}