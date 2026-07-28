import { Controller, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsMailService } from './reports.mail';


@Controller('reports')
export class ReportsController {

    constructor(
        private readonly reportsService: ReportsService,
        private readonly reportsMailService: ReportsMailService
    ) {}


    @Post('generate')
    generate(){
        return this.reportsService.generateWeeklyReports();
    }


    @Post('email-test')
    async emailTest(){

        const report =
            await this.reportsService.generateWeeklyReports();


        await this.reportsMailService.sendReport(
            'alupidi888@gmail.com',
            report.pdf
        );


        return {
            message: 'Email inviata'
        };

    }

}