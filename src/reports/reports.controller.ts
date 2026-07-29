import {Body,Controller,Get,Param,Post} from '@nestjs/common';
import {ReportsService} from './reports.service';
import {ReportsMailService} from './reports.mail';
import {PrismaService} from '../prisma/prisma.service';


@Controller('reports')
export class ReportsController{

constructor(
private readonly reportsService:ReportsService,
private readonly reportsMailService:ReportsMailService,
private readonly prisma:PrismaService
){}



@Post('generate/:festivalId')
async generate(
@Param('festivalId') festivalId:string
){

return this.reportsService.generateFestivalReport(festivalId);

}



@Post('email-test/:festivalId')
async emailTest(
@Param('festivalId') festivalId:string
){

const festival=
await this.prisma.festival.findUnique({
where:{
id:festivalId
}
});


const report=
await this.reportsService.generateFestivalReport(festivalId);


await this.reportsMailService.sendReport(
festival?.reportEmail||null,
report.pdf
);


return {
message:"Email inviata"
};

}



@Post('email/:festivalId')
async saveEmail(
@Param('festivalId') festivalId:string,
@Body() body:{email:string}
){

return this.prisma.festival.update({

where:{
id:festivalId
},

data:{
reportEmail:body.email
}

});

}



@Get('email/:festivalId')
async getEmail(
@Param('festivalId') festivalId:string
){

const festival=
await this.prisma.festival.findUnique({

where:{
id:festivalId
},

select:{
reportEmail:true
}

});


return {
email:festival?.reportEmail||""
};

}

}