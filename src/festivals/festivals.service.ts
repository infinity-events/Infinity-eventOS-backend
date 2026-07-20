import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFestivalDto } from './dto/create-festival.dto';


@Injectable()
export class FestivalsService {

  constructor(
    private prisma: PrismaService
  ) {}


  create(dto: CreateFestivalDto) {

    return this.prisma.festival.create({
      data: {

        name: dto.name,

        location: dto.location,

        startDate: dto.startDate,

        endDate: dto.endDate,

      }
    });

  }


  findAll() {

    return this.prisma.festival.findMany();

  }

}