import { Controller, Get, Post, Body, Param} from '@nestjs/common';
import { WristbandsService } from './wristbands.service';
import { CreateWristbandDto } from './dto/create-wristband.dto';
import { ActivateWristbandDto } from './dto/activate-wristband.dto';
import { RegisterWristbandDto } from './dto/register-wristband.dto';




@Controller('wristbands')
export class WristbandsController {


constructor(
private service:WristbandsService
){}


@Get('code/:code')
findByCode(
 @Param('code') code:string
){
 console.log("CODICE RICEVUTO:", code);
 return this.service.findByCode(code);
} 

@Post()
create(
 @Body() dto:CreateWristbandDto
){

 return this.service.create(dto);

}

@Post('activate')
activate(
 @Body() dto:ActivateWristbandDto
){

 return this.service.activate(dto);

}

@Post('register')
register(
 @Body() dto:RegisterWristbandDto
){

console.log("RICEVUTO:", dto);

 return this.service.register(dto);

}
}