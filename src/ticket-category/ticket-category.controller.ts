import {Controller,Post,Get,Put,Delete,Body,Param} from '@nestjs/common';
import {TicketCategoryService} from './ticket-category.service';
import {CreateCategoryDto} from './dto/create-category.dto';

@Controller('ticket-category')
export class TicketCategoryController{

constructor(
private service:TicketCategoryService
){}


@Post()
create(
@Body() dto:CreateCategoryDto
){
return this.service.create(dto);
}


@Get(':festivalId')
findAll(
@Param('festivalId') festivalId:string
){
return this.service.findAll(festivalId);
}


@Put(':id')
update(
@Param('id') id:string,
@Body() dto:CreateCategoryDto
){
return this.service.update(id,dto);
}


@Delete(':id')
remove(
@Param('id') id:string
){
return this.service.remove(id);
}

}