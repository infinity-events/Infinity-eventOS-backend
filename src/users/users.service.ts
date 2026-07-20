import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';


@Injectable()
export class UsersService {


    constructor(
        private prisma: PrismaService
    ){}



    create(dto: CreateUserDto){

        return this.prisma.user.create({

        data:{

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


}