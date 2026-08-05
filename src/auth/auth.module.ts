import { Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';


@Module({
  imports:[
    PrismaModule
  ],
  providers:[
    FirebaseAdminService,
    FirebaseAuthGuard
  ],
  exports:[
    FirebaseAdminService,
    FirebaseAuthGuard
  ]
})
export class AuthModule {}