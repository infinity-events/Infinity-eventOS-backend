import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

type Report = {
  festival: string;
  festivalLocation?: string | null;
  period?: string;
  generatedAt?: string;

  participants: {
    total: number;
    inside: number;
    outside: number;
  };

  tickets: {
    sold: number;
    revenue: number;
    averagePrice: number;
    entryRate: number;
    breakdown: {
      name: string;
      type: string;
      quantity: number;
      revenue: number;
    }[];
  };

  entrances: {
    total: number;
    uniqueParticipants: number;
    timeline: {
      time: string;
      value: number;
    }[];
    peak: {
      value: number;
      time: string | null;
    };
  };

  wristbands: {
    total: number;
    activated: number;
    inactive: number;
    activationPercentage: number;
  };

  pos: {
    revenue: number;
    transactions: number;
    productsSold: number;
    timeline: {
      time: string;
      value: number;
    }[];
    topProducts: {
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
    }[];
    paymentMethods: {
      method: string;
      transactions: number;
      revenue: number;
    }[];
  };

  wallet: {
    topups: number;
    spent: number;
    refunds: number;
    averageSpend: number;
  };

  event: {
    ticketRevenue: number;
    posRevenue: number;
    totalRevenue: number;
  };
};

@Injectable()
export class ReportsPdfService {
  async generate(
    data: Report[],
  ): Promise<{
    buffer: Buffer;
    fileName: string;
  }> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
      info: {
        Title:
          'Infinity EventOS - Report Analytics',
        Author: 'Infinity EventOS',
      },
    });

    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk) =>
      chunks.push(chunk),
    );

    const pdfFinished = new Promise<Buffer>(
      (resolve) =>
        doc.on('end', () =>
          resolve(Buffer.concat(chunks)),
        ),
    );

    data.forEach((report, index) => {
      if (index > 0) {
        doc.addPage();
      }

      this.renderReport(doc, report);
    });

    doc.end();

    return {
      buffer: await pdfFinished,
      fileName:
        'infinity-eventos-report-' +
        Date.now() +
        '.pdf',
    };
  }

  private renderReport(
    doc: PDFKit.PDFDocument,
    report: Report,
  ) {
    this.renderHeader(doc, report);

    let y = 175;

    // =========================================================
    // OVERVIEW
    // =========================================================

    this.sectionTitle(
      doc,
      'Event overview',
      'Riepilogo generale dell’evento',
      42,
      y,
    );

    y += 34;

    const cards = [
      {
        label: 'PARTECIPANTI',
        value: String(
          report.participants.total,
        ),
      },
      {
        label: 'DENTRO',
        value: String(
          report.participants.inside,
        ),
      },
      {
        label: 'FUORI',
        value: String(
          report.participants.outside,
        ),
      },
      {
        label: 'INGRESSI',
        value: String(
          report.entrances.total,
        ),
      },
    ];

    this.drawCards(
      doc,
      cards,
      42,
      y,
    );

    y += 94;

    const revenueCards = [
      {
        label: 'TICKET',
        value: formatCurrency(
          report.event.ticketRevenue,
        ),
      },
      {
        label: 'POS',
        value: formatCurrency(
          report.event.posRevenue,
        ),
      },
      {
        label: 'TOTALE',
        value: formatCurrency(
          report.event.totalRevenue,
        ),
      },
      {
        label: 'PRODOTTI',
        value: String(
          report.pos.productsSold,
        ),
      },
    ];

    this.drawCards(
      doc,
      revenueCards,
      42,
      y,
    );

    // =========================================================
    // ENTRANCES
    // =========================================================

    y += 115;

    this.sectionTitle(
      doc,
      'Entrances',
      'Andamento degli accessi al festival',
      42,
      y,
    );

    y += 34;

    this.drawInfoBox(
      doc,
      42,
      y,
      511,
      80,
      [
        [
          'Ingressi totali',
          String(
            report.entrances.total,
          ),
        ],
        [
          'Partecipanti dentro',
          String(
            report.entrances
              .uniqueParticipants,
          ),
        ],
        [
          'Entry rate',
          `${report.tickets.entryRate}%`,
        ],
        [
          'Picco',
          report.entrances.peak.time
            ? `${report.entrances.peak.value} alle ${report.entrances.peak.time}`
            : 'N/D',
        ],
      ],
    );

    y += 100;

    this.drawTimelineTable(
      doc,
      'Andamento ingressi',
      report.entrances.timeline,
      42,
      y,
      'Ingressi',
    );

    // =========================================================
    // TICKETS
    // =========================================================

    doc.addPage();

    this.renderHeader(
      doc,
      report,
      'Ticket & wristbands',
    );

    y = 175;

    this.sectionTitle(
      doc,
      'Ticket performance',
      'Vendite e ricavi per categoria',
      42,
      y,
    );

    y += 34;

    this.drawTable(
      doc,
      [
        'CATEGORIA',
        'QTA',
        'RICAVO',
      ],
      report.tickets.breakdown.map(
        (item) => [
          item.name,
          String(item.quantity),
          formatCurrency(item.revenue),
        ],
      ),
      42,
      y,
      [280, 70, 150],
    );

    y +=
      70 +
      Math.max(
        report.tickets.breakdown.length,
        1,
      ) *
        25;

    y += 25;

    this.drawInfoBox(
      doc,
      42,
      y,
      511,
      95,
      [
        [
          'Ticket venduti',
          String(
            report.tickets.sold,
          ),
        ],
        [
          'Incasso ticket',
          formatCurrency(
            report.tickets.revenue,
          ),
        ],
        [
          'Prezzo medio',
          formatCurrency(
            report.tickets.averagePrice,
          ),
        ],
        [
          'Entry rate',
          `${report.tickets.entryRate}%`,
        ],
      ],
    );

    y += 125;

    this.sectionTitle(
      doc,
      'Wristbands',
      'Stato di attivazione dei braccialetti',
      42,
      y,
    );

    y += 35;

    this.drawProgress(
      doc,
      42,
      y,
      511,
      report.wristbands
        .activationPercentage,
    );

    y += 55;

    this.drawTable(
      doc,
      [
        'STATO',
        'QUANTITÀ',
        'PERCENTUALE',
      ],
      [
        [
          'Attivati',
          String(
            report.wristbands.activated,
          ),
          `${report.wristbands.activationPercentage}%`,
        ],
        [
          'Non attivati',
          String(
            report.wristbands.inactive,
          ),
          `${Math.max(
            100 -
              report.wristbands
                .activationPercentage,
            0,
          )}%`,
        ],
      ],
      42,
      y,
      [280, 110, 110],
    );

    // =========================================================
    // POS
    // =========================================================

    doc.addPage();

    this.renderHeader(
      doc,
      report,
      'POS & revenue',
    );

    y = 175;

    this.sectionTitle(
      doc,
      'POS performance',
      'Vendite e incassi del punto vendita',
      42,
      y,
    );

    y += 34;

    this.drawInfoBox(
      doc,
      42,
      y,
      511,
      80,
      [
        [
          'Incasso POS',
          formatCurrency(
            report.pos.revenue,
          ),
        ],
        [
          'Transazioni',
          String(
            report.pos.transactions,
          ),
        ],
        [
          'Prodotti venduti',
          String(
            report.pos.productsSold,
          ),
        ],
        [
          'Media transazione',
          formatCurrency(
            report.pos.transactions
              ? report.pos.revenue /
                  report.pos.transactions
              : 0,
          ),
        ],
      ],
    );

    y += 105;

    this.sectionTitle(
      doc,
      'Top products',
      'Prodotti più venduti',
      42,
      y,
    );

    y += 34;

    this.drawTable(
      doc,
      [
        'PRODOTTO',
        'QTA',
        'RICAVO',
      ],
      report.pos.topProducts.map(
        (item) => [
          item.name,
          String(item.quantity),
          formatCurrency(item.revenue),
        ],
      ),
      42,
      y,
      [280, 70, 150],
    );

    y +=
      70 +
      Math.max(
        report.pos.topProducts.length,
        1,
      ) *
        25;

    y += 25;

    this.sectionTitle(
      doc,
      'Payment methods',
      'Incassi suddivisi per metodo di pagamento',
      42,
      y,
    );

    y += 34;

    this.drawTable(
      doc,
      [
        'METODO',
        'TRANSAZIONI',
        'RICAVO',
      ],
      report.pos.paymentMethods.map(
        (item) => [
          item.method,
          String(item.transactions),
          formatCurrency(item.revenue),
        ],
      ),
      42,
      y,
      [220, 130, 150],
    );

    // =========================================================
    // WALLET + FINAL
    // =========================================================

    doc.addPage();

    this.renderHeader(
      doc,
      report,
      'Financial summary',
    );

    y = 175;

    this.sectionTitle(
      doc,
      'Wallet',
      'Movimenti economici dei wallet partecipanti',
      42,
      y,
    );

    y += 34;

    this.drawInfoBox(
      doc,
      42,
      y,
      511,
      100,
      [
        [
          'Ricariche',
          formatCurrency(
            report.wallet.topups,
          ),
        ],
        [
          'Spesa',
          formatCurrency(
            report.wallet.spent,
          ),
        ],
        [
          'Rimborsi',
          formatCurrency(
            report.wallet.refunds,
          ),
        ],
        [
          'Media spesa',
          formatCurrency(
            report.wallet.averageSpend,
          ),
        ],
      ],
    );

    y += 135;

    this.sectionTitle(
      doc,
      'Final financial summary',
      'Riepilogo economico dell’evento',
      42,
      y,
    );

    y += 34;

    this.drawLargeRevenueBox(
      doc,
      42,
      y,
      511,
      145,
      report,
    );

    y += 180;

    this.sectionTitle(
      doc,
      'Key metrics',
      'Indicatori principali',
      42,
      y,
    );

    y += 34;

    this.drawTable(
      doc,
      [
        'INDICATORE',
        'VALORE',
      ],
      [
        [
          'Partecipanti totali',
          String(
            report.participants.total,
          ),
        ],
        [
          'Partecipanti dentro',
          String(
            report.participants.inside,
          ),
        ],
        [
          'Partecipanti fuori',
          String(
            report.participants.outside,
          ),
        ],
        [
          'Ticket venduti',
          String(
            report.tickets.sold,
          ),
        ],
        [
          'Incasso ticket',
          formatCurrency(
            report.event.ticketRevenue,
          ),
        ],
        [
          'Incasso POS',
          formatCurrency(
            report.event.posRevenue,
          ),
        ],
        [
          'Incasso totale',
          formatCurrency(
            report.event.totalRevenue,
          ),
        ],
        [
          'Attivazione braccialetti',
          `${report.wristbands.activationPercentage}%`,
        ],
        [
          'Picco ingressi',
          report.entrances.peak.time
            ? `${report.entrances.peak.value} alle ${report.entrances.peak.time}`
            : 'N/D',
        ],
      ],
      42,
      y,
      [350, 160],
    );

    this.renderFooter(doc, report);
  }

  private renderHeader(
    doc: PDFKit.PDFDocument,
    report: Report,
    subtitle?: string,
  ) {
    const pageWidth = doc.page.width;

    doc
      .rect(
        0,
        0,
        pageWidth,
        130,
      )
      .fill('#111827');

    doc
      .rect(
        0,
        126,
        pageWidth,
        4,
      )
      .fill('#8B5CF6');

    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(
        'Infinity EventOS',
        42,
        28,
      );

    doc
      .fillColor('#C4B5FD')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(
        'EVENT ANALYTICS REPORT',
        42,
        61,
        {
          characterSpacing: 1.3,
        },
      );

    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(
        report.festival,
        42,
        80,
        {
          width: 320,
        },
      );

    doc
      .fillColor('#CBD5E1')
      .font('Helvetica')
      .fontSize(8)
      .text(
        subtitle ||
          report.festivalLocation ||
          'Festival',
        42,
        105,
      );

    doc
      .fillColor('#CBD5E1')
      .font('Helvetica')
      .fontSize(8)
      .text(
        formatDate(report.generatedAt),
        pageWidth - 180,
        105,
        {
          width: 138,
          align: 'right',
        },
      );
  }

  private sectionTitle(
    doc: PDFKit.PDFDocument,
    title: string,
    subtitle: string,
    x: number,
    y: number,
  ) {
    doc
      .fillColor('#6D28D9')
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(title, x, y);

    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(8)
      .text(
        subtitle,
        x,
        y + 20,
      );
  }

  private drawCards(
    doc: PDFKit.PDFDocument,
    cards: {
      label: string;
      value: string;
    }[],
    x: number,
    y: number,
  ) {
    const width = 511;
    const gap = 10;
    const cardWidth =
      (width - gap * 3) / 4;

    cards.forEach(
      (card, index) => {
        const cardX =
          x +
          index *
            (cardWidth + gap);

        doc
          .roundedRect(
            cardX,
            y,
            cardWidth,
            82,
            10,
          )
          .fill('#FFFFFF')
          .stroke('#E2E8F0');

        doc
          .fillColor('#64748B')
          .font('Helvetica-Bold')
          .fontSize(7)
          .text(
            card.label,
            cardX + 14,
            y + 15,
          );

        doc
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .fontSize(17)
          .text(
            card.value,
            cardX + 14,
            y + 39,
            {
              width:
                cardWidth - 20,
            },
          );
      },
    );
  }

  private drawInfoBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    items: [string, string][],
  ) {
    doc
      .roundedRect(
        x,
        y,
        width,
        height,
        10,
      )
      .fill('#F8FAFC')
      .stroke('#E2E8F0');

    const columnWidth =
      width / items.length;

    items.forEach(
      (item, index) => {
        const itemX =
          x +
          index * columnWidth +
          16;

        doc
          .fillColor('#64748B')
          .font('Helvetica-Bold')
          .fontSize(7)
          .text(
            item[0].toUpperCase(),
            itemX,
            y + 22,
            {
              width:
                columnWidth - 24,
            },
          );

        doc
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .fontSize(12)
          .text(
            item[1],
            itemX,
            y + 45,
            {
              width:
                columnWidth - 24,
            },
          );
      },
    );
  }

  private drawTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: string[][],
    x: number,
    y: number,
    widths: number[],
  ) {
    const rowHeight = 25;
    const headerHeight = 32;

    let currentY = y;

    doc
      .roundedRect(
        x,
        y,
        widths.reduce(
          (a, b) => a + b,
          0,
        ),
        headerHeight +
          Math.max(rows.length, 1) *
            rowHeight +
          12,
        10,
      )
      .fill('#FFFFFF')
      .stroke('#E2E8F0');

    let currentX = x + 12;

    headers.forEach(
      (header, index) => {
        doc
          .fillColor('#64748B')
          .font('Helvetica-Bold')
          .fontSize(7)
          .text(
            header,
            currentX,
            currentY + 13,
            {
              width:
                widths[index] - 12,
            },
          );

        currentX +=
          widths[index];
      },
    );

    currentY +=
      headerHeight;

    doc
      .moveTo(x + 12, currentY)
      .lineTo(
        x +
          widths.reduce(
            (a, b) => a + b,
            0,
          ) -
          12,
        currentY,
      )
      .stroke('#E2E8F0');

    rows.forEach(
      (row, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc
            .rect(
              x + 8,
              currentY,
              widths.reduce(
                (a, b) => a + b,
                0,
              ) - 16,
              rowHeight,
            )
            .fill('#F8FAFC');
        }

        currentX = x + 12;

        row.forEach(
          (cell, index) => {
            doc
              .fillColor('#111827')
              .font(
                index === 0
                  ? 'Helvetica'
                  : 'Helvetica-Bold',
              )
              .fontSize(8)
              .text(
                cell,
                currentX,
                currentY + 8,
                {
                  width:
                    widths[index] -
                    12,
                },
              );

            currentX +=
              widths[index];
          },
        );

        currentY +=
          rowHeight;
      },
    );
  }

  private drawTimelineTable(
    doc: PDFKit.PDFDocument,
    title: string,
    timeline: {
      time: string;
      value: number;
    }[],
    x: number,
    y: number,
    label: string,
  ) {
    this.sectionTitle(
      doc,
      title,
      'Ingressi registrati nel tempo',
      x,
      y,
    );

    const rows = timeline
      .slice(-12)
      .map((item) => [
        item.time,
        String(item.value),
      ]);

    this.drawTable(
      doc,
      ['ORARIO', label.toUpperCase()],
      rows.length
        ? rows
        : [['N/D', '0']],
      x,
      y + 34,
      [350, 160],
    );
  }

  private drawProgress(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    percentage: number,
  ) {
    doc
      .roundedRect(
        x,
        y,
        width,
        14,
        7,
      )
      .fill('#E2E8F0');

    if (percentage > 0) {
      doc
        .roundedRect(
          x,
          y,
          width *
            Math.min(
              percentage,
              100,
            ) /
            100,
          14,
          7,
        )
        .fill('#10B981');
    }

    doc
      .fillColor('#334155')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        `${percentage}% attivati`,
        x,
        y + 24,
      );
  }

  private drawLargeRevenueBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    report: Report,
  ) {
    doc
      .roundedRect(
        x,
        y,
        width,
        height,
        12,
      )
      .fill('#111827');

    doc
      .fillColor('#94A3B8')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(
        'INCASSO TOTALE',
        x + 24,
        y + 22,
      );

    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(
        formatCurrency(
          report.event.totalRevenue,
        ),
        x + 24,
        y + 48,
      );

    doc
      .fillColor('#CBD5E1')
      .font('Helvetica')
      .fontSize(9)
      .text(
        `Ticket ${formatCurrency(
          report.event.ticketRevenue,
        )}   •   POS ${formatCurrency(
          report.event.posRevenue,
        )}`,
        x + 24,
        y + 94,
      );
  }

  private renderFooter(
    doc: PDFKit.PDFDocument,
    report: Report,
  ) {
    const pageHeight =
      doc.page.height;
    const pageWidth =
      doc.page.width;

    doc
      .fillColor('#94A3B8')
      .font('Helvetica')
      .fontSize(7)
      .text(
        `Infinity EventOS  |  ${report.festival}  |  Report analytics`,
        42,
        pageHeight - 30,
      );

    doc
      .text(
        'Confidential',
        pageWidth - 110,
        pageHeight - 30,
        {
          width: 68,
          align: 'right',
        },
      );
  }
}

function formatCurrency(
  value: number,
) {
  return (
    'EUR ' +
    Number(value || 0).toFixed(2)
  );
}

function formatDate(
  value?: string,
) {
  return value
    ? new Date(
        value,
      ).toLocaleDateString('it-IT')
    : new Date().toLocaleDateString(
        'it-IT',
      );
}