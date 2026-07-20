import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FestivalsModule } from './festivals/festivals.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { WristbandsModule } from './wristbands/wristbands.module';
import { WalletsModule } from './wallets/wallets.module';



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
  ],
})
export class AppModule {}