import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketMailService {
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.resend = new Resend(
      process.env.RESEND_API_KEY,
    );
  }

  async sendTicketEmail(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: {
        user: true,
        festival: true,
        category: true,
      },
    });

    if (!ticket) {
      throw new Error(
        `Ticket ${ticketId} non trovato`,
      );
    }

    if (!ticket.user?.email) {
      throw new Error(
        `Il ticket ${ticketId} non ha un'email associata`,
      );
    }

    // Evitiamo di inviare nuovamente la mail
    if (ticket.emailSentAt) {
      console.log(
        `Email già inviata per ticket ${ticket.id}`,
      );

      return {
        sent: false,
        alreadySent: true,
      };
    }

    const templateId =
      process.env.RESEND_TICKET_TEMPLATE_ID;

    if (!templateId) {
      throw new Error(
        'RESEND_TICKET_TEMPLATE_ID non configurato',
      );
    }

    const festival = ticket.festival;

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat(
        'it-IT',
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        },
      ).format(date);
    };

    const formatTime = (date: Date) => {
      return new Intl.DateTimeFormat(
        'it-IT',
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      ).format(date);
    };

    const result =
      await this.resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          'noreply@infinityeventos.dpdns.org',

        to: ticket.user.email,

        subject:
          `Il tuo biglietto per ${festival.name} è pronto 🎟️`,

        template: {
          id: templateId,

          variables: {
            FIRST_NAME:
              ticket.user.firstName || '',

            LAST_NAME:
              ticket.user.lastName || '',

            FESTIVAL_NAME:
              festival.name,

            FESTIVAL_LOCATION:
              festival.location,

            FESTIVAL_DATE:
              `${formatDate(festival.startDate)} - ${formatDate(festival.endDate)}`,

            FESTIVAL_START:
              formatTime(festival.startDate),

            FESTIVAL_END:
              formatTime(festival.endDate),

            TICKET_CODE:
              ticket.code,

            TICKET_TYPE:
              ticket.category?.name ||
              ticket.type,

            TICKET_PRICE:
              Number(ticket.price).toFixed(2),

            TICKET_STATUS:
              ticket.paymentStatus,

            TICKET_ID:
              ticket.id,
          },
        },
      });

    console.log(
      'Email ticket inviata:',
      result,
    );

    await this.prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        emailSentAt: new Date(),
      },
    });

    return {
      sent: true,
      alreadySent: false,
      result,
    };
  }
}