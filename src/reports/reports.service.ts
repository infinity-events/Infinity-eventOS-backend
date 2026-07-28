import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ReportsService {

    constructor(
        private prisma: PrismaService
    ) {}


    async generateWeeklyReports() {

    const reports: {
        festival: string;
        ticketsSold: number;
        activatedWristbands: number;
        inactiveWristbands: number;
        revenue: number;
    }[] = [];


    const festivals = await this.prisma.festival.findMany();


    for (const festival of festivals) {

        const ticketsSold =
            await this.prisma.ticket.count({
                where:{
                    festivalId: festival.id
                }
            });


        const activatedWristbands =
            await this.prisma.wristband.count({
                where:{
                    festivalId: festival.id,
                    activated:true
                }
            });


        const inactiveWristbands =
            await this.prisma.wristband.count({
                where:{
                    festivalId: festival.id,
                    activated:false
                }
            });


        const revenue =
            await this.prisma.ticket.aggregate({
                where:{
                    festivalId:festival.id
                },
                _sum:{
                    price:true
                }
            });


        reports.push({
            festival: festival.name,
            ticketsSold,
            activatedWristbands,
            inactiveWristbands,
            revenue: revenue._sum.price ?? 0
        });

    }


    return reports;

}

}