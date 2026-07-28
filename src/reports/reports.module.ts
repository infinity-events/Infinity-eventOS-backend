import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsScheduler } from './reports.scheduler';
import { PrismaService } from '../prisma/prisma.service';


@Module({
  controllers: [
    ReportsController
  ],

  providers: [
    ReportsService,
    ReportsScheduler,
    PrismaService
  ]
})
export class ReportsModule {}