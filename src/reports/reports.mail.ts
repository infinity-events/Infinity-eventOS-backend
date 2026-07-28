import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';


@Injectable()
export class ReportsMailService {


    private resend = new Resend(
        process.env.RESEND_API_KEY
    );


    async sendReport(
        email: string,
        pdf: {
            buffer: Buffer;
            fileName: string;
        }
    ){


        await this.resend.emails.send({

            from: 'Infinity EventOS <reports@tuodominio.it>',

            to: email,

            subject:
            'Report settimanale Analytics',

            text:
            'In allegato trovi il report settimanale del tuo evento.',


            attachments:[
                {
                    filename: pdf.fileName,

                    content: pdf.buffer
                }
            ]

        });


    }

}