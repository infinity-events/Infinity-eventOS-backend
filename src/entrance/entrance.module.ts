import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EntranceController } from './entrance.controller';
import { EntranceService } from './entrance.service';

@Module({
  imports: [PrismaModule],
  controllers: [EntranceController],
  providers: [EntranceService],
})
export class EntranceModule {}
