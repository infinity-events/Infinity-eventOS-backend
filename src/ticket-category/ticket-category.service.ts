import {Injectable,NotFoundException} from '@nestjs/common';
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
createdAt:'desc'
}

});

}


async update(
id:string,
dto:CreateCategoryDto
){

const category=
await this.prisma.ticketCategory.findUnique({
where:{id}
});


if(!category)
throw new NotFoundException();


return this.prisma.ticketCategory.update({

where:{id},

data:{
name:dto.name,
price:dto.price,
quantity:dto.quantity,
type:dto.type
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