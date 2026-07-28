import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from './reports.service';


@Injectable()
export class ReportsScheduler {

  constructor(
    private readonly reportsService: ReportsService
  ) {}


  @Cron('0 8 * * 1')
  async weeklyReport() {

    console.log('📊 Avvio report settimanale');

    await this.reportsService.generateWeeklyReports();

  }

}