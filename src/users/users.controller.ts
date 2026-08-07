import { Controller, Post, Body, Get, Put, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SyncUserDto } from './dto/sync-user.dto';

@Controller('users')
export class UsersController {

    constructor(
        private usersService: UsersService
    ){}

    @Post()
    create(
        @Body() dto: CreateUserDto
    ){
        return this.usersService.create(dto);
    }

    @Get()
    findAll(){
        return this.usersService.findAll();
    }

    @Post('sync')
    sync(
        @Body() dto: SyncUserDto
    ){
        console.log("SYNC USER:", dto);
        return this.usersService.sync(dto);
    }

    @Put(':id')
    update(
        @Param('id') id:string,
        @Body() dto:any
    ){
        return this.usersService.update(id,dto);
    }

}