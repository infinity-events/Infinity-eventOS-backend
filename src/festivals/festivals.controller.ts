import { Controller, Post, Body, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { FestivalsService } from './festivals.service';
import { CreateFestivalDto } from './dto/create-festival.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';


@Controller('festivals')
@UseGuards(FirebaseAuthGuard)
export class FestivalsController {


  constructor(
    private festivalsService: FestivalsService
  ) {}


  @Post()
  create(
    @Body() dto: CreateFestivalDto,
    @Req() req: any
  ) {

    return this.festivalsService.create(dto, req.user.id);

  }


  @Get()
  findAll(@Req() req: any){

    return this.festivalsService.findAll(req.user.id);

  }

  @Patch(':id')
    update(
    @Param('id') id:string,
    @Body() dto:any,
    @Req() req:any
    ){

    return this.festivalsService.update(id,dto,req.user.id);

  }

}
