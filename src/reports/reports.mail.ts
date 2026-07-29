import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ReportsMailService{

private resend=new Resend(
process.env.RESEND_API_KEY
);


async sendReport(
email:string|null,
pdf:{
buffer:Buffer;
fileName:string;
}
){

if(!email){
throw new Error("Email report non configurata");
}


const result=await this.resend.emails.send({

from:'onboarding@resend.dev',

to:email,

subject:'Report settimanale Analytics',

text:'In allegato trovi il report settimanale del tuo evento.',

attachments:[
{
filename:pdf.fileName,
content:pdf.buffer
}
]

});


console.log(result);

return result;

}

}