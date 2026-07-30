import {TicketType} from "@prisma/client";

export class CreateCategoryDto{

festivalId!:string;

name!:string;

type!:TicketType;

price!:number;

quantity!:number;

}