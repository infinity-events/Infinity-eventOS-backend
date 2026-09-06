import { Module } from '@nestjs/common';

import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RolesGuard } from './roles.guard';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  providers: [
    FirebaseAdminService,
    FirebaseAuthGuard,
    RolesGuard,
  ],
  exports: [
    FirebaseAdminService,
    FirebaseAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}