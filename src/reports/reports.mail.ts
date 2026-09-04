import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ReportsMailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendReport(
    email: string | null,
    pdf: { buffer: Buffer; fileName: string },
    report: any,
  ) {
    if (!email) {
      throw new Error('Email report non configurata');
    }

    const from = process.env.RESEND_FROM_EMAIL;

    if (!from) {
      throw new Error('RESEND_FROM_EMAIL non configurato');
    }

    const festivalName = report?.festival || 'Infinity EventOS';

    const result = await this.resend.emails.send({
      from,
      to: email,
      subject: `Report ${festivalName}`,
      text: `Report evento ${festivalName}.

Il report completo è disponibile nell'allegato PDF.

Infinity EventOS`,
      attachments: [
        {
          filename: pdf.fileName,
          content: pdf.buffer,
        },
      ],
    });

    console.log('REPORT EMAIL RESULT:', result);

    return result;
  }
}