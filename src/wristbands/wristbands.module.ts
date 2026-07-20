import { Module } from '@nestjs/common';
import { WristbandsService } from './wristbands.service';
import { WristbandsController } from './wristbands.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({

  imports: [
    PrismaModule
  ],

  controllers: [
    WristbandsController
  ],

  providers: [
    WristbandsService
  ],

})
export class WristbandsModule {}