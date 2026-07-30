import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateCategoryDto} from './dto/create-category.dto';


@Injectable()
export class TicketCategoryService{


constructor(
private prisma:PrismaService
){}



create(dto:CreateCategoryDto){

return this.prisma.ticketCategory.create({

data:{

festivalId:dto.festivalId,

name:dto.name,

type:dto.type,

price:dto.price,

quantity:dto.quantity

}

});

}



findAll(festivalId:string){

return this.prisma.ticketCategory.findMany({

where:{
festivalId
},

orderBy:{
createdAt:"desc"
}

});

}



remove(id:string){

return this.prisma.ticketCategory.delete({

where:{
id
}

});

}


}