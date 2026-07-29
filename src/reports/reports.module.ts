import {Module} from '@nestjs/common';
import {ReportsController} from './reports.controller';
import {ReportsService} from './reports.service';
import {ReportsMailService} from './reports.mail';
import {ReportsPdfService} from './reports.pdf';
import {ReportsScheduler} from './reports.scheduler';
import {PrismaService} from '../prisma/prisma.service';

@Module({
controllers:[
ReportsController
],
providers:[
ReportsService,
ReportsMailService,
ReportsPdfService,
ReportsScheduler,
PrismaService
]
})
export class ReportsModule{}