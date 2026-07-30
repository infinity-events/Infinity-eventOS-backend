import {Injectable,BadRequestException,NotFoundException,} from '@nestjs/common';
import {EntranceAction,EntranceMethod,TicketStatus,} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {EntranceQrDto,EntranceNfcDto,EntranceManualDto,} from './dto/entrance.dto';

@Injectable()
export class EntranceService {

  constructor(
    private prisma: PrismaService
  ) {}


  async checkQr(dto: EntranceQrDto) {

    const ticket = await this.prisma.ticket.findFirst({

      where:{
        festivalId:dto.festivalId,
        code:dto.code.trim()
      },

      include:{
        user:true,
        wristband:true
      }

    });


    if(!ticket){
      throw new NotFoundException(
        "Biglietto non valido"
      );
    }


    return this.registerEntrance(
      ticket,
      EntranceMethod.QR,
      dto
    );

  }



  async checkNfc(dto: EntranceNfcDto) {


    const wristband =
      await this.prisma.wristband.findFirst({

        where:{
          festivalId:dto.festivalId,

          OR:[
            {
              uid:dto.uid
            },
            {
              code:dto.uid
            },
            {
              activationCode:dto.uid
            }
          ]
        },


        include:{
          ticket:{
            include:{
              user:true,
              wristband:true
            }
          }
        }

      });



    if(!wristband){

      throw new NotFoundException(
        "Braccialetto non trovato"
      );

    }



    if(!wristband.activated){

      throw new BadRequestException(
        "Braccialetto non attivato"
      );

    }



    if(!wristband.ticket){

      throw new BadRequestException(
        "Nessun biglietto associato"
      );

    }



    return this.registerEntrance(
      wristband.ticket,
      EntranceMethod.NFC,
      dto,
      wristband.id
    );

  }




  async checkManual(dto: EntranceManualDto){


    const ticket =
      await this.prisma.ticket.findFirst({

        where:{

          festivalId:dto.festivalId,


          OR:[

            {
              code:dto.query
            },


            {
              user:{
                email:{
                  contains:dto.query,
                  mode:'insensitive'
                }
              }
            },


            {
              user:{
                firstName:{
                  contains:dto.query,
                  mode:'insensitive'
                }
              }
            },


            {
              user:{
                lastName:{
                  contains:dto.query,
                  mode:'insensitive'
                }
              }
            }

          ]

        },


        include:{
          user:true,
          wristband:true
        }

      });



    if(!ticket){

      throw new NotFoundException(
        "Partecipante non trovato"
      );

    }



    return this.registerEntrance(
      ticket,
      EntranceMethod.MANUAL,
      dto
    );

  }





  private async registerEntrance(
    ticket:any,
    method:EntranceMethod,
    dto:any,
    wristbandId?:string
  ){


    if(
      ticket.status === TicketStatus.CANCELLED
    ){

      throw new BadRequestException(
        "Biglietto annullato"
      );

    }



    const alreadyEntered =
      await this.prisma.entranceLog.findFirst({

        where:{
          ticketId:ticket.id,
          action:EntranceAction.ENTRY
        },

        orderBy:{
          createdAt:'desc'
        }

      });



    if(alreadyEntered){

      return {

        valid:true,

        allowed:false,

        alreadyChecked:true,

        reason:"ALREADY_ENTERED",

        log:alreadyEntered,

        ticket

      };

    }





    const log =
      await this.prisma.entranceLog.create({

        data:{

          festivalId:ticket.festivalId,

          ticketId:ticket.id,

          userId:ticket.userId,


          wristbandId:
          wristbandId ??
          ticket.wristband?.id,


          method,


          action:EntranceAction.ENTRY,


          gate:dto.gate,


          device:dto.device

        },


        include:{

          ticket:true,

          user:true,

          wristband:true

        }

      });





    return {

      valid:true,

      allowed:true,

      alreadyChecked:false,

      reason:"VALID",

      log,

      ticket

    };


  }






  async logs(
    festivalId:string
  ){


    return this.prisma.entranceLog.findMany({

      where:{
        festivalId
      },


      orderBy:{
        createdAt:'desc'
      },


      take:100,


      include:{

        ticket:true,

        user:true,

        wristband:true,

        operator:true

      }

    });


  }






  async stats(
    festivalId:string
  ){


    const total =
      await this.prisma.ticket.count({

        where:{

          festivalId,


          status:{
            not:TicketStatus.CANCELLED
          }

        }

      });




    const inside =
      await this.prisma.entranceLog.count({

        where:{

          festivalId,

          action:EntranceAction.ENTRY

        }

      });




    return {

      totalTickets:total,

      inside,

      waiting:
      Math.max(total-inside,0)

    };


  }


}