import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { ReportsMailService } from './reports.mail';


@Injectable()
export class ReportsScheduler {


    constructor(
        private readonly reportsService: ReportsService,
        private readonly reportsMailService: ReportsMailService
    ) {}



    @Cron('0 8 * * 1')
    async weeklyReport() {


        console.log('📊 Generazione report settimanale iniziata');


        const report =
            await this.reportsService.generateWeeklyReports();



        await this.reportsMailService.sendReport(
            'alupidi888@gmail.com',
            report.pdf
        );



        console.log('✅ Report inviato correttamente');


    }


}