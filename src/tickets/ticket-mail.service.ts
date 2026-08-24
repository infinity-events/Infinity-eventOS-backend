import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketMailService {
  private readonly logger = new Logger(TicketMailService.name);
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY non configurata. Le email dei biglietti non verranno inviate.',
      );
    }

    this.resend = new Resend(apiKey);
  }

  async sendTicketEmail(ticketId: string) {
    /*
     * Recuperiamo tutti i dati necessari per la mail.
     */
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
      throw new Error('Biglietto non trovato');
    }

    /*
     * Il biglietto deve essere associato ad un utente
     * con un indirizzo email.
     */
    if (!ticket.user?.email) {
      this.logger.warn(
        `Impossibile inviare email per il ticket ${ticket.id}: email utente assente.`,
      );

      return {
        sent: false,
        reason: 'USER_EMAIL_MISSING',
      };
    }

    /*
     * Evitiamo di mandare nuovamente la stessa email.
     *
     * Questo è importante perché Stripe può inviare
     * più volte lo stesso webhook.
     */
    if (ticket.emailSentAt) {
      this.logger.log(
        `Email già inviata per il ticket ${ticket.id} il ${ticket.emailSentAt.toISOString()}`,
      );

      return {
        sent: false,
        alreadySent: true,
        emailSentAt: ticket.emailSentAt,
      };
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY non configurata');
    }

    const from =
      process.env.RESEND_FROM_EMAIL ||
      'VividFest <onboarding@resend.dev>';

    const firstName = ticket.user.firstName || '';
    const festivalName = ticket.festival.name;
    const festivalLocation = ticket.festival.location || '';

    const categoryName =
      ticket.category?.name ||
      ticket.type ||
      'Biglietto';

    const price = Number(ticket.price || 0).toFixed(2);

    const startDate = ticket.festival.startDate
      ? new Date(ticket.festival.startDate).toLocaleDateString(
          'it-IT',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          },
        )
      : '';

    const endDate = ticket.festival.endDate
      ? new Date(ticket.festival.endDate).toLocaleDateString(
          'it-IT',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          },
        )
      : '';

    const period =
      startDate && endDate && startDate !== endDate
        ? `${startDate} - ${endDate}`
        : startDate;

    /*
     * HTML della mail.
     */
    const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Il tuo biglietto - ${this.escapeHtml(festivalName)}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f5f7;
    font-family:Arial,Helvetica,sans-serif;
    color:#111827;
  "
>

  <div
    style="
      max-width:600px;
      margin:0 auto;
      padding:32px 16px;
    "
  >

    <!-- HEADER -->

    <div
      style="
        background:#011d1f;
        border-radius:18px 18px 0 0;
        padding:28px;
        text-align:center;
      "
    >

      <div
        style="
          color:#ffffff;
          font-size:28px;
          font-weight:800;
          letter-spacing:2px;
        "
      >
        VIVIDFEST
      </div>

      <div
        style="
          color:#8ad9df;
          font-size:13px;
          margin-top:8px;
        "
      >
        BIGLIETTO CONFERMATO
      </div>

    </div>

    <!-- CONTENT -->

    <div
      style="
        background:#ffffff;
        padding:32px 28px;
      "
    >

      <h1
        style="
          margin:0 0 12px 0;
          font-size:24px;
          color:#111827;
        "
      >
        Ciao ${this.escapeHtml(firstName)}! 👋
      </h1>

      <p
        style="
          margin:0 0 28px 0;
          font-size:16px;
          line-height:1.6;
          color:#4b5563;
        "
      >
        Il tuo acquisto è andato a buon fine.
        Questo è il tuo biglietto per <strong>${this.escapeHtml(
          festivalName,
        )}</strong>.
      </p>


      <!-- EVENT CARD -->

      <div
        style="
          background:#f8fafc;
          border:1px solid #e5e7eb;
          border-radius:14px;
          padding:20px;
          margin-bottom:24px;
        "
      >

        <div
          style="
            font-size:20px;
            font-weight:700;
            color:#011d1f;
            margin-bottom:16px;
          "
        >
          ${this.escapeHtml(festivalName)}
        </div>

        ${
          period
            ? `
        <div
          style="
            font-size:14px;
            color:#4b5563;
            margin-bottom:8px;
          "
        >
          📅 ${this.escapeHtml(period)}
        </div>
        `
            : ''
        }

        ${
          festivalLocation
            ? `
        <div
          style="
            font-size:14px;
            color:#4b5563;
          "
        >
          📍 ${this.escapeHtml(festivalLocation)}
        </div>
        `
            : ''
        }

      </div>


      <!-- TICKET -->

      <div
        style="
          border:2px solid #047e89;
          border-radius:16px;
          padding:24px;
          text-align:center;
          margin-bottom:24px;
        "
      >

        <div
          style="
            font-size:12px;
            font-weight:700;
            letter-spacing:1.5px;
            color:#6b7280;
            text-transform:uppercase;
            margin-bottom:10px;
          "
        >
          ${this.escapeHtml(categoryName)}
        </div>

        <div
          style="
            font-size:32px;
            font-weight:800;
            color:#011d1f;
            letter-spacing:2px;
            margin-bottom:10px;
          "
        >
          ${this.escapeHtml(ticket.code)}
        </div>

        <div
          style="
            font-size:14px;
            color:#6b7280;
          "
        >
          Codice del tuo biglietto
        </div>

      </div>


      <!-- PRICE -->

      <div
        style="
          display:flex;
          justify-content:space-between;
          border-top:1px solid #e5e7eb;
          border-bottom:1px solid #e5e7eb;
          padding:16px 0;
          margin-bottom:28px;
        "
      >

        <span
          style="
            font-size:15px;
            color:#6b7280;
          "
        >
          Totale pagato
        </span>

        <strong
          style="
            font-size:17px;
            color:#111827;
          "
        >
          € ${price}
        </strong>

      </div>


      <!-- INFO -->

      <div
        style="
          background:#f0f9fa;
          border-radius:12px;
          padding:16px;
          font-size:14px;
          line-height:1.6;
          color:#374151;
        "
      >

        <strong>All'ingresso</strong><br />

        Mostra il codice del biglietto
        presente in questa email al personale
        dell'ingresso.

      </div>

    </div>


    <!-- FOOTER -->

    <div
      style="
        background:#011d1f;
        border-radius:0 0 18px 18px;
        padding:22px;
        text-align:center;
        color:#94a3b8;
        font-size:12px;
        line-height:1.6;
      "
    >

      Questa email è stata generata automaticamente.<br />

      <span style="color:#ffffff;">
        VividFest
      </span>

    </div>

  </div>

</body>
</html>
`;

    /*
     * Versione testuale alternativa.
     * Utile per client email che non supportano HTML.
     */
    const text = `
VIVIDFEST

Ciao ${firstName}!

Il tuo acquisto è andato a buon fine.

EVENTO
${festivalName}

${period ? `Data: ${period}` : ''}
${festivalLocation ? `Luogo: ${festivalLocation}` : ''}

BIGLIETTO
Tipo: ${categoryName}
Codice: ${ticket.code}
Totale: € ${price}

Mostra il codice del biglietto all'ingresso.

Grazie per aver acquistato il tuo biglietto!
`;

    /*
     * INVIO RESEND
     */
    const result = await this.resend.emails.send({
      from,
      to: ticket.user.email,
      subject: `🎟️ Il tuo biglietto per ${festivalName}`,
      html,
      text,
    });

    /*
     * Resend restituisce un errore in caso di problema.
     */
    if (result.error) {
      this.logger.error(
        `Errore Resend per ticket ${ticket.id}: ${result.error.message}`,
      );

      throw new Error(
        result.error.message || 'Errore durante invio email',
      );
    }

    /*
     * Segniamo il ticket come email inviata.
     */
    const emailSentAt = new Date();

    await this.prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        emailSentAt,
      },
    });

    this.logger.log(
      `Email ticket inviata a ${ticket.user.email} per ${festivalName}. Ticket: ${ticket.code}`,
    );

    return {
      sent: true,
      email: ticket.user.email,
      ticketId: ticket.id,
      emailSentAt,
      resendId: result.data?.id ?? null,
    };
  }

  /**
   * Protegge l'HTML da caratteri speciali inseriti dall'utente.
   */
  private escapeHtml(value: string) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}