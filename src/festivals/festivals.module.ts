import { Module } from '@nestjs/common';
import { FestivalsController } from './festivals.controller';
import { FestivalsService } from './festivals.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    PrismaModule,
    AuthModule
  ],
  controllers: [
    FestivalsController
  ],
  providers: [
    FestivalsService
  ],
})
export class FestivalsModule {}
