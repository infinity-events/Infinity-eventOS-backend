import { Module } from '@nestjs/common';
import { WristbandsService } from './wristbands.service';
import { WristbandsController } from './wristbands.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({

  imports: [
    PrismaModule,
    AuthModule
  ],

  controllers: [
    WristbandsController
  ],

  providers: [
    WristbandsService,
  ],

})
export class WristbandsModule {}