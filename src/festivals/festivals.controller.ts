import { Controller, Post, Body, Get } from '@nestjs/common';
import { FestivalsService } from './festivals.service';
import { CreateFestivalDto } from './dto/create-festival.dto';


@Controller('festivals')
export class FestivalsController {


  constructor(
    private festivalsService: FestivalsService
  ) {}


  @Post()
  create(
    @Body() dto: CreateFestivalDto
  ) {

    return this.festivalsService.create(dto);

  }


  @Get()
  findAll(){

    return this.festivalsService.findAll();

  }

}