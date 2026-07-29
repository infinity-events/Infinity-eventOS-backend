import {Injectable} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {ReportsService} from './reports.service';
import {ReportsMailService} from './reports.mail';
import {PrismaService} from '../prisma/prisma.service';


@Injectable()
export class ReportsScheduler{


constructor(
private readonly reportsService:ReportsService,
private readonly reportsMailService:ReportsMailService,
private readonly prisma:PrismaService
){}



@Cron('0 8 * * 1')
async weeklyReport(){

console.log("📊 Avvio report settimanali");

const festivals=
await this.prisma.festival.findMany();



for(const festival of festivals){

try{

if(!festival.reportEmail){

console.log(
`⚠️ ${festival.name}: email report non configurata`
);
continue;

}

const report=
await this.reportsService.generateFestivalReport(
festival.id
);

await this.reportsMailService.sendReport(
festival.reportEmail,
report.pdf
);



console.log(
`✅ Report inviato: ${festival.name}`
);


}catch(error){

console.error(
`❌ Errore report ${festival.name}:`,
error
);
}
}
console.log("🏁 Report settimanali completati");

}

}