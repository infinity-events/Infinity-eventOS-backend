import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FestivalsModule } from './festivals/festivals.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { WristbandsModule } from './wristbands/wristbands.module';
import { WalletsModule } from './wallets/wallets.module';
import { AuthModule } from './auth/auth.module';



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
    AuthModule
  ],
})
export class AppModule {}