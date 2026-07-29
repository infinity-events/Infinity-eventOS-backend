import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {ReportsPdfService} from './reports.pdf';


@Injectable()
export class ReportsService{


constructor(
private prisma:PrismaService,
private pdfService:ReportsPdfService
){}



async generateFestivalReport(
festivalId:string
){


const festival=
await this.prisma.festival.findUnique({

where:{
id:festivalId
}

});


if(!festival){
throw new Error("Festival non trovato");
}



const ticketsSold=
await this.prisma.ticket.count({

where:{
festivalId
}

});



const wristbandsActivated=
await this.prisma.wristband.count({

where:{
festivalId,
activated:true
}

});



const wristbandsInactive=
await this.prisma.wristband.count({

where:{
festivalId,
activated:false
}

});



const revenue=
await this.prisma.ticket.aggregate({

where:{
festivalId
},

_sum:{
price:true
}

});



const reports=[{

festival:festival.name,

ticketsSold,

activatedWristbands:wristbandsActivated,

inactiveWristbands:wristbandsInactive,

revenue:revenue._sum.price||0

}];



const pdf=
await this.pdfService.generate(reports);



return {
reports,
pdf
};

}






async generateWeeklyReports(){

const festivals=
await this.prisma.festival.findMany();

const results:{
reports:{
festival:string;
ticketsSold:number;
activatedWristbands:number;
inactiveWristbands:number;
revenue:number;
}[];
pdf:{
buffer:Buffer;
fileName:string;
};
}[]=[];


for(const festival of festivals){


const report=
await this.generateFestivalReport(
festival.id
);


results.push(report);


}


return results;

}


}