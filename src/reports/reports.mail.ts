import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ReportsMailService {
  async sendReport(
    email: string | null,
    pdf: { buffer: Buffer; fileName: string },
    _report: any,
  ) {
    const recipient = email?.trim();

    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      throw new BadRequestException('Email report non valida');
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from?.trim()) {
      throw new InternalServerErrorException(
        'Servizio email non configurato',
      );
    }

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: from.trim(),
      to: recipient,
      subject: 'Event report',
      text: 'Please see the attached PDF report.',
      attachments: [
        {
          filename: pdf.fileName,
          content: pdf.buffer,
        },
      ],
    });

    if (result.error) {
      throw new ServiceUnavailableException(
        'Invio email non riuscito',
      );
    }

    return result;
  }
}
