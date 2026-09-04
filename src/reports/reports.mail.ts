import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ReportsMailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(
      process.env.RESEND_API_KEY,
    );
  }

  async sendReport(
    email: string | null,
    pdf: {
      buffer: Buffer;
      fileName: string;
    },
    report: any,
  ) {
    if (!email) {
      throw new Error(
        'Email report non configurata',
      );
    }

    const from =
      process.env.RESEND_FROM_EMAIL;

    if (!from) {
      throw new Error(
        'RESEND_FROM_EMAIL non configurata',
      );
    }

    const festivalName =
      String(
        report?.festival ||
          'Festival',
      );

    const location =
      String(
        report?.festivalLocation ||
          '',
      );

    const period =
      String(
        report?.period ||
          '',
      );

    const participants =
      Number(
        report?.participants
          ?.total || 0,
      );

    const inside =
      Number(
        report?.participants
          ?.inside || 0,
      );

    const outside =
      Number(
        report?.participants
          ?.outside || 0,
      );

    const tickets =
      Number(
        report?.tickets?.sold || 0,
      );

    const ticketRevenue =
      Number(
        report?.event
          ?.ticketRevenue || 0,
      );

    const posRevenue =
      Number(
        report?.event
          ?.posRevenue || 0,
      );

    const totalRevenue =
      Number(
        report?.event
          ?.totalRevenue || 0,
      );

    const entrances =
      Number(
        report?.entrances
          ?.total || 0,
      );

    const peakValue =
      Number(
        report?.entrances
          ?.peak?.value || 0,
      );

    const peakTime =
      report?.entrances
        ?.peak?.time || 'N/D';

    const activated =
      Number(
        report?.wristbands
          ?.activated || 0,
      );

    const activationPercentage =
      Number(
        report?.wristbands
          ?.activationPercentage ||
          0,
      );

    const productsSold =
      Number(
        report?.pos
          ?.productsSold || 0,
      );

    const posTransactions =
      Number(
        report?.pos
          ?.transactions || 0,
      );

    const walletTopups =
      Number(
        report?.wallet
          ?.topups || 0,
      );

    const walletSpent =
      Number(
        report?.wallet
          ?.spent || 0,
      );

    const walletRefunds =
      Number(
        report?.wallet
          ?.refunds || 0,
      );

    const walletAverage =
      Number(
        report?.wallet
          ?.averageSpend || 0,
      );

    const topProducts =
      Array.isArray(
        report?.pos?.topProducts,
      )
        ? report.pos.topProducts
            .slice(0, 5)
            .map(
              (product: any) =>
                `${escapeHtml(
                  product.name,
                )} — ${
                  product.quantity
                } — ${formatCurrency(
                  product.revenue,
                )}`,
            )
            .join('<br>')
        : 'Nessun dato disponibile';

    const ticketBreakdown =
      Array.isArray(
        report?.tickets
          ?.breakdown,
      )
        ? report.tickets.breakdown
            .map(
              (item: any) =>
                `${escapeHtml(
                  item.name,
                )} — ${
                  item.quantity
                } — ${formatCurrency(
                  item.revenue,
                )}`,
            )
            .join('<br>')
        : 'Nessun dato disponibile';

    const subject =
      `Report evento - ${festivalName}`;

    const text = `
Infinity EventOS
Report evento: ${festivalName}

${location ? `Luogo: ${location}` : ''}
${period ? `Periodo: ${period}` : ''}

RIEPILOGO

Partecipanti: ${participants}
Dentro: ${inside}
Fuori: ${outside}

Ticket venduti: ${tickets}
Ingressi: ${entrances}

Incasso ticket: ${formatCurrency(
      ticketRevenue,
    )}
Incasso POS: ${formatCurrency(
      posRevenue,
    )}
Incasso totale: ${formatCurrency(
      totalRevenue,
    )}

BRACCIALETTI

Attivati: ${activated}
Percentuale attivazione: ${activationPercentage}%

POS

Transazioni: ${posTransactions}
Prodotti venduti: ${productsSold}

Picco ingressi: ${peakValue} alle ${peakTime}

WALLET

Ricariche: ${formatCurrency(
      walletTopups,
    )}
Spesa: ${formatCurrency(
      walletSpent,
    )}
Rimborsi: ${formatCurrency(
      walletRefunds,
    )}
Media spesa: ${formatCurrency(
      walletAverage,
    )}

Il report completo è allegato a questa email.

Infinity EventOS
`.trim();

    const html = `
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${escapeHtml(
    subject,
  )}</title>
</head>

<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#111827;">

  <div style="max-width:620px;margin:0 auto;padding:32px 16px;">

    <div style="background:#111827;border-radius:10px 10px 0 0;padding:24px;">
      <div style="font-size:12px;font-weight:bold;letter-spacing:1px;color:#c4b5fd;">
        INFINITY EVENTOS
      </div>

      <div style="font-size:22px;font-weight:bold;color:#ffffff;margin-top:10px;">
        Report evento
      </div>

      <div style="font-size:15px;color:#e5e7eb;margin-top:6px;">
        ${escapeHtml(
          festivalName,
        )}
      </div>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 10px 10px;padding:24px;">

      ${
        location || period
          ? `
      <div style="font-size:13px;color:#64748b;margin-bottom:22px;">
        ${
          location
            ? escapeHtml(
                location,
              )
            : ''
        }
        ${
          location && period
            ? ' · '
            : ''
        }
        ${
          period
            ? escapeHtml(
                period,
              )
            : ''
        }
      </div>
      `
          : ''
      }

      <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">
        Riepilogo
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${mailRow(
          'Partecipanti',
          participants,
        )}
        ${mailRow(
          'Dentro',
          inside,
        )}
        ${mailRow(
          'Fuori',
          outside,
        )}
        ${mailRow(
          'Ticket venduti',
          tickets,
        )}
        ${mailRow(
          'Ingressi',
          entrances,
        )}
      </table>

      <div style="height:24px;"></div>

      <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">
        Risultato economico
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${mailRow(
          'Incasso ticket',
          formatCurrency(
            ticketRevenue,
          ),
        )}
        ${mailRow(
          'Incasso POS',
          formatCurrency(
            posRevenue,
          ),
        )}
        ${mailRow(
          'Incasso totale',
          formatCurrency(
            totalRevenue,
          ),
          true,
        )}
      </table>

      <div style="height:24px;"></div>

      <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">
        Braccialetti
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${mailRow(
          'Attivati',
          activated,
        )}
        ${mailRow(
          'Percentuale attivazione',
          `${activationPercentage}%`,
        )}
      </table>

      <div style="height:24px;"></div>

      <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">
        POS
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${mailRow(
          'Transazioni',
          posTransactions,
        )}
        ${mailRow(
          'Prodotti venduti',
          productsSold,
        )}
        ${mailRow(
          'Picco ingressi',
          `${peakValue} alle ${peakTime}`,
        )}
      </table>

      <div style="height:24px;"></div>

      <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">
        Prodotti più venduti
      </div>

      <div style="font-size:13px;line-height:1.8;color:#475569;">
        ${topProducts}
      </div>

      <div style="height:24px;"></div>

      <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">
        Ticket
      </div>

      <div style="font-size:13px;line-height:1.8;color:#475569;">
        ${ticketBreakdown}
      </div>

      <div style="height:24px;"></div>

      <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">
        Wallet
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${mailRow(
          'Ricariche',
          formatCurrency(
            walletTopups,
          ),
        )}
        ${mailRow(
          'Spesa',
          formatCurrency(
            walletSpent,
          ),
        )}
        ${mailRow(
          'Rimborsi',
          formatCurrency(
            walletRefunds,
          ),
        )}
        ${mailRow(
          'Media spesa',
          formatCurrency(
            walletAverage,
          ),
        )}
      </table>

      <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
        Il report completo è disponibile nell'allegato PDF.
      </div>

    </div>

    <div style="padding:18px;text-align:center;font-size:11px;color:#94a3b8;">
      Infinity EventOS
    </div>

  </div>

</body>
</html>
`.trim();

    const result =
      await this.resend.emails.send({
        from,
        to: email,
        subject,

        text,

        html,

        attachments: [
          {
            filename:
              pdf.fileName,
            content:
              pdf.buffer,
          },
        ],
      });

    console.log(
      '📧 Report email result:',
      result,
    );

    return result;
  }
}

function formatCurrency(
  value: number,
) {
  return `EUR ${Number(
    value || 0,
  ).toFixed(2)}`;
}

function escapeHtml(
  value: unknown,
) {
  return String(value ?? '')
    .replace(
      /&/g,
      '&amp;',
    )
    .replace(
      /</g,
      '&lt;',
    )
    .replace(
      />/g,
      '&gt;',
    )
    .replace(
      /"/g,
      '&quot;',
    )
    .replace(
      /'/g,
      '&#039;',
    );
}

function mailRow(
  label: string,
  value: unknown,
  strong = false,
) {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;color:#111827;${
        strong
          ? 'font-weight:bold;'
          : ''
      }">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}