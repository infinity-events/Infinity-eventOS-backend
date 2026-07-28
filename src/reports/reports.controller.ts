import { Controller, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {

    constructor(
        private readonly reportsService: ReportsService
    ) {}

    @Post('generate')
    async generateReport(){
        return this.reportsService.generateWeeklyReports();
    }

}