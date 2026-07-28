import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsScheduler } from './reports.scheduler';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsPdfService } from './reports.pdf';


@Module({
  controllers: [
    ReportsController
  ],

  providers: [
    ReportsService,
    ReportsScheduler,
    PrismaService,
    ReportsPdfService
  ]
})
export class ReportsModule {}