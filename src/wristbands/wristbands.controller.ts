import {Controller,Get,Post,Body,Param,Req,UseGuards} from '@nestjs/common';
import {WristbandsService} from './wristbands.service';
import {CreateWristbandDto} from './dto/create-wristband.dto';
import {ActivateWristbandDto} from './dto/activate-wristband.dto';
import {RegisterWristbandDto} from './dto/register-wristband.dto';
import {FirebaseAuthGuard} from '../auth/firebase-auth.guard';

@Controller('wristbands')
export class WristbandsController{

constructor(
private service:WristbandsService
){}

@Get('code/:code')
findByCode(
@Param('code') code:string
){
console.log("CODICE RICEVUTO:",code);
return this.service.findByCode(code);
}

@Post()
create(
@Body() dto:CreateWristbandDto
){
return this.service.create(dto);
}

@Post('activate')
@UseGuards(FirebaseAuthGuard)
activate(
@Req() req,
@Body() dto:ActivateWristbandDto
){
return this.service.activate(
dto,
req.user.uid
);
}

@Post('register')
register(
@Body() dto:RegisterWristbandDto
){
console.log("RICEVUTO:",dto);
return this.service.register(dto);
}

@Get('festival/:festivalId')
findByFestival(
@Param('festivalId') festivalId:string
){
return this.service.findByFestival(festivalId);
}

@Get('stats/:festivalId')
stats(
@Param('festivalId') festivalId:string
){
return this.service.stats(festivalId);
}

}