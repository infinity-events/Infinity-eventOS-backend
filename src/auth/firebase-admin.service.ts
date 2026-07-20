import { Injectable } from '@nestjs/common';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';


@Injectable()
export class FirebaseAdminService {


constructor(){

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


}