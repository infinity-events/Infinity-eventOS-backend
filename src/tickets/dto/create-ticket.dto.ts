import {TicketType} from "@prisma/client";

export class CreateTicketDto {

festivalId!:string;

type!:TicketType;

price!:number;

quantity?:number;

userId?:string;

}