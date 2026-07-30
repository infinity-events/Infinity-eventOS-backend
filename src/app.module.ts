import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FestivalsModule } from './festivals/festivals.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { WristbandsModule } from './wristbands/wristbands.module';
import { WalletsModule } from './wallets/wallets.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsModule } from './reports/reports.module';
import { EntranceModule } from './entrance/entrance.module';
import { TicketCategoryModule } from './ticket-category/ticket-category.module';
import { PrismaModule } from './prisma/prisma.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FestivalsModule,
    UsersModule,
    TicketsModule,
    WristbandsModule,
    WalletsModule,
    AuthModule,
    AnalyticsModule,
    ScheduleModule.forRoot(),
    ReportsModule,
    EntranceModule,
    TicketCategoryModule,
    PrismaModule
  ],
})
export class AppModule {}
