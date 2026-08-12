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
},
report:any
){

if(!email){
throw new Error("Email report non configurata");
}

const templateId=process.env.RESEND_TEMPLATE_ID;
if(!templateId){
throw new Error("RESEND_TEMPLATE_ID non configurato");
}


const result=await this.resend.emails.send({

from:process.env.RESEND_FROM_EMAIL||'onboarding@resend.dev',

to:email,

subject:`Report Analytics - ${report.festival}`,

template:{
id:templateId,
variables:{
FESTIVAL_NAME:report.festival,
FESTIVAL_LOCATION:report.festivalLocation||'',
PERIOD:report.period||'',
TICKETS_SOLD:report.ticketsSold,
REVENUE:Number(report.revenue||0),
ACTIVATED_WRISTBANDS:report.activatedWristbands,
INACTIVE_WRISTBANDS:report.inactiveWristbands,
ENTRANCES:Number(report.entrances||0)
}
},

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
