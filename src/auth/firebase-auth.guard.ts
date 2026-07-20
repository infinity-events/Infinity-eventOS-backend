import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';

import { FirebaseAdminService } from './firebase-admin.service';



@Injectable()
export class FirebaseAuthGuard implements CanActivate {


constructor(
    private firebase: FirebaseAdminService
){}



async canActivate(
    context: ExecutionContext
){

    const request = context.switchToHttp().getRequest();


    const authHeader = request.headers.authorization;


    if(!authHeader){

        throw new UnauthorizedException(
            "Token mancante"
        );

    }


    const token = authHeader.split(' ')[1];


    try{

        const decoded =
            await this.firebase.verifyToken(token);


        request.user = decoded;


        return true;


    }catch(error){

        throw new UnauthorizedException(
            "Token non valido"
        );

    }

}

}