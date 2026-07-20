import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWristbandDto } from './dto/create-wristband.dto';
import { ActivateWristbandDto } from './dto/activate-wristband.dto';
import { RegisterWristbandDto } from './dto/register-wristband.dto';


@Injectable()
export class WristbandsService {


constructor(
 private prisma:PrismaService
){}



generateCode(prefix:string){

 return prefix + "-" +
 Math.random()
 .toString(36)
 .substring(2,8)
 .toUpperCase();

}



create(dto: CreateWristbandDto){

 return this.prisma.wristband.create({

  data:{

   code:this.generateCode("WB"),

   activationCode:this.generateCode("ACT"),

   activated:false,


   ticket:{
    connect:{
     id:dto.ticketId
    }
   },


   festival:{
    connect:{
     id:dto.festivalId
    }
   }

  }

 })

}

async activate(dto: ActivateWristbandDto, firebaseUid:string){

const wristband = await this.prisma.wristband.findUnique({

where:{
    code:dto.code
}

});

console.log("USER ID RICEVUTO:", firebaseUid);

const user = await this.prisma.user.findUnique({
  where:{
    firebaseUid
  }
});

console.log("USER TROVATO:", user);

if(!wristband){

    throw new Error("Bracciale non trovato");

}



if(wristband.activationCode !== dto.activationCode){

    throw new Error("Codice di attivazione errato");

}



if(wristband.activated){

    throw new Error("Bracciale già attivato");

}



return this.prisma.wristband.update({

where:{
    id:wristband.id
},


data:{

    activated:true,

    user:{
        connect:{
            firebaseUid
        }
    }

}

});


}

async findByCode(code:string){

return this.prisma.wristband.findUnique({

where:{
    activationCode:code
},

include:{
    user:{
        include:{
            wallet:true
        }
    },
    ticket:true
}

});

}

async register(dto:RegisterWristbandDto){


const existing =
await this.prisma.wristband.findUnique({
 where:{
  id:dto.uid
 }
})


if(existing){

 throw new Error(
  "Braccialetto già registrato"
 )

}

console.log("REGISTER UID:", dto.uid);

const activationCode =
Math.random()
.toString(36)
.substring(2,8)
.toUpperCase()

return this.prisma.wristband.create({

data:{

 code: `WB-${Math.random()
    .toString(36)
    .substring(2,8)
    .toUpperCase()}`,

 id:dto.uid,

 activationCode

}

})


}

}

