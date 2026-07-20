import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SyncUserDto } from './dto/sync-user.dto';


@Injectable()
export class UsersService {


    constructor(
        private prisma: PrismaService
    ){}



    create(dto: CreateUserDto){

return this.prisma.user.create({

data:{
firebaseUid:dto.firebaseUid,
email:dto.email,
firstName:dto.firstName,
lastName:dto.lastName,

wallet:{
    create:{
        balance:0
    }
}
}
});

}



    findAll(){
        return this.prisma.user.findMany();
    }

    async sync(dto: SyncUserDto){
    return this.prisma.user.upsert({

        where:{
            firebaseUid: dto.firebaseUid
        },

        update:{
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName
        },

        create:{
            firebaseUid: dto.firebaseUid,
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName
        }
    });
    }
}