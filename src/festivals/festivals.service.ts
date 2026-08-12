import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFestivalDto } from './dto/create-festival.dto';


@Injectable()
export class FestivalsService {

  constructor(
    private prisma: PrismaService
  ) {}


  create(dto: CreateFestivalDto, ownerId: string) {

    return this.prisma.festival.create({
      data: {

        name: dto.name,

        location: dto.location,

        startDate:new Date(dto.startDate),
        
        endDate:new Date(dto.endDate),

        ownerId,

      }
    });

  }


  findAll(ownerId: string) {

    return this.prisma.festival.findMany({
      where: { ownerId },
      orderBy: { startDate: 'asc' },
    });

  }

  async update(id:string,dto:any,ownerId:string){

    const festival=await this.prisma.festival.findFirst({where:{id,ownerId}});
    if(!festival)throw new NotFoundException('Festival non trovato');

    return this.prisma.festival.update({

    where:{
    id
    },

    data:{

    name:dto.name,
    location:dto.location,
    status:dto.status

    }

    });

  }

}
