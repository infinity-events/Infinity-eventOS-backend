import { Injectable } from '@nestjs/common';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class FirebaseAdminService {


constructor(
    private prisma: PrismaService
){

    if(getApps().length === 0){

        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID!,
                privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            })
        });

    }

}



verifyToken(token:string){

    return getAuth().verifyIdToken(token);

}

async syncUser(decoded:any){

    const existing =
    await this.prisma.user.findUnique({
        where:{
            firebaseUid: decoded.uid
        }
    });


    if(existing){
        return existing;
    }


    return this.prisma.user.create({

        data:{
            firebaseUid: decoded.uid,
            email: decoded.email,
            firstName: decoded.name?.split(" ")[0] ?? "",
            lastName: decoded.name?.split(" ")[1] ?? ""
        }

    });

}

}