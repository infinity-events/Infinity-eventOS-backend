import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsPdfService } from './reports.pdf';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: ReportsPdfService,
  ) {}

  async generateFestivalReport(festivalId: string) {
    const festival = await this.prisma.festival.findUnique({
      where: {
        id: festivalId,
      },
    });

    if (!festival) {
      throw new NotFoundException('Festival non trovato');
    }

    // ---------------------------------------------------------
    // TICKET
    // ---------------------------------------------------------

    const tickets = await this.prisma.ticket.findMany({
      where: {
        festivalId,
        status: {
          not: 'CANCELLED',
        },
        paymentStatus: 'PAID',
      },
      select: {
        id: true,
        type: true,
        price: true,
      },
    });

    const ticketsSold = tickets.length;

    const ticketRevenue = tickets.reduce(
      (sum, ticket) => sum + Number(ticket.price || 0),
      0,
    );

    const ticketBreakdownMap = new Map<
      string,
      { name: string; type: string; quantity: number; revenue: number }
    >();

    for (const ticket of tickets) {
      const key = ticket.type;

      if (!ticketBreakdownMap.has(key)) {
        ticketBreakdownMap.set(key, {
          name: ticket.type,
          type: ticket.type,
          quantity: 0,
          revenue: 0,
        });
      }

      const item = ticketBreakdownMap.get(key)!;

      item.quantity += 1;
      item.revenue += Number(ticket.price || 0);
    }

    const ticketBreakdown = Array.from(ticketBreakdownMap.values());

    // ---------------------------------------------------------
    // INGRESSI
    // ---------------------------------------------------------

    const entranceLogs = await this.prisma.entranceLog.findMany({
      where: {
        festivalId,
        action: 'ENTRY',
        ticket: {
          status: {
            not: 'CANCELLED',
          },
          paymentStatus: 'PAID',
        },
      },
      select: {
        id: true,
        ticketId: true,
        createdAt: true,
        method: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Un ticket può avere più log storici.
    // Per il report contiamo ogni partecipante una sola volta.
    const uniqueEnteredTickets = new Set<string>();

    for (const log of entranceLogs) {
      uniqueEnteredTickets.add(log.ticketId);
    }

    const participantsInside = uniqueEnteredTickets.size;

    const participantsTotal = ticketsSold;

    const participantsOutside = Math.max(
      participantsTotal - participantsInside,
      0,
    );

    const entrances = entranceLogs.length;

    // ---------------------------------------------------------
    // ANDAMENTO INGRESSI
    // ---------------------------------------------------------

    const entranceTimelineMap = new Map<
      string,
      { time: string; value: number }
    >();

    for (const log of entranceLogs) {
      const time = new Date(log.createdAt).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const current = entranceTimelineMap.get(time);

      if (current) {
        current.value += 1;
      } else {
        entranceTimelineMap.set(time, {
          time,
          value: 1,
        });
      }
    }

    const entranceTimeline = Array.from(
      entranceTimelineMap.values(),
    );

    let peakValue = 0;
    let peakTime: string | null = null;

    for (const point of entranceTimeline) {
      if (point.value > peakValue) {
        peakValue = point.value;
        peakTime = point.time;
      }
    }

    // ---------------------------------------------------------
    // WRISTBANDS
    // ---------------------------------------------------------

    const wristbands = await this.prisma.wristband.findMany({
      where: {
        festivalId,
      },
      select: {
        id: true,
        activated: true,
      },
    });

    const wristbandsTotal = wristbands.length;

    const activatedWristbands = wristbands.filter(
      (wristband) => wristband.activated,
    ).length;

    const inactiveWristbands =
      wristbandsTotal - activatedWristbands;

    const activationPercentage = participantsTotal
      ? Math.round(
          (activatedWristbands / participantsTotal) * 100,
        )
      : 0;

    // ---------------------------------------------------------
    // POS
    // ---------------------------------------------------------

    const posTransactions =
      await this.prisma.posTransaction.findMany({
        where: {
          festivalId,
        },
        select: {
          id: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          items: {
            select: {
              productId: true,
              productName: true,
              unitPrice: true,
              quantity: true,
              subtotal: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

    const posRevenue = posTransactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.total || 0),
      0,
    );

    const posTransactionCount = posTransactions.length;

    let productsSold = 0;

    const topProductsMap = new Map<
      string,
      {
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
      }
    >();

    for (const transaction of posTransactions) {
      for (const item of transaction.items) {
        productsSold += Number(item.quantity || 0);

        const key = item.productId;

        const current = topProductsMap.get(key);

        if (current) {
          current.quantity += Number(item.quantity || 0);
          current.revenue += Number(item.subtotal || 0);
        } else {
          topProductsMap.set(key, {
            productId: item.productId,
            name: item.productName,
            quantity: Number(item.quantity || 0),
            revenue: Number(item.subtotal || 0),
          });
        }
      }
    }

    const topProducts = Array.from(
      topProductsMap.values(),
    )
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // ---------------------------------------------------------
    // POS TIMELINE
    // ---------------------------------------------------------

    const posTimelineMap = new Map<
      string,
      { time: string; value: number }
    >();

    for (const transaction of posTransactions) {
      const time = new Date(
        transaction.createdAt,
      ).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const current = posTimelineMap.get(time);

      if (current) {
        current.value += Number(transaction.total || 0);
      } else {
        posTimelineMap.set(time, {
          time,
          value: Number(transaction.total || 0),
        });
      }
    }

    const posTimeline = Array.from(
      posTimelineMap.values(),
    );

    // ---------------------------------------------------------
    // POS PER METODO
    // ---------------------------------------------------------

    const paymentMethodsMap = new Map<
      string,
      {
        method: string;
        transactions: number;
        revenue: number;
      }
    >();

    for (const transaction of posTransactions) {
      const method = transaction.paymentMethod;

      const current = paymentMethodsMap.get(method);

      if (current) {
        current.transactions += 1;
        current.revenue += Number(transaction.total || 0);
      } else {
        paymentMethodsMap.set(method, {
          method,
          transactions: 1,
          revenue: Number(transaction.total || 0),
        });
      }
    }

    const posPaymentMethods = Array.from(
      paymentMethodsMap.values(),
    );

    // ---------------------------------------------------------
    // WALLET
    // ---------------------------------------------------------

    const wallets = await this.prisma.wallet.findMany({
      where: {
        user: {
          wristbands: {
            some: {
              festivalId,
            },
          },
        },
      },
      select: {
        id: true,
        transactions: {
          where: {
            festivalId,
          },
          select: {
            amount: true,
            type: true,
          },
        },
      },
    });

    let walletTopups = 0;
    let walletSpent = 0;
    let walletRefunds = 0;

    for (const wallet of wallets) {
      for (const transaction of wallet.transactions) {
        const amount = Number(transaction.amount || 0);

        if (transaction.type === 'TOPUP') {
          walletTopups += amount;
        }

        if (transaction.type === 'PURCHASE') {
          walletSpent += amount;
        }

        if (transaction.type === 'REFUND') {
          walletRefunds += amount;
        }
      }
    }

    const averageWalletSpend = participantsTotal
      ? walletSpent / participantsTotal
      : 0;

    // ---------------------------------------------------------
    // REVENUE
    // ---------------------------------------------------------

    const totalRevenue =
      ticketRevenue + posRevenue;

    const entryRate = participantsTotal
      ? Math.round(
          (participantsInside / participantsTotal) * 100,
        )
      : 0;

    // ---------------------------------------------------------
    // REPORT OBJECT
    // ---------------------------------------------------------

    const report = {
      festival: festival.name,
      festivalLocation: festival.location,

      period:
        festival.startDate && festival.endDate
          ? `${festival.startDate.toLocaleDateString(
              'it-IT',
            )} - ${festival.endDate.toLocaleDateString(
              'it-IT',
            )}`
          : undefined,

      generatedAt: new Date().toISOString(),

      participants: {
        total: participantsTotal,
        inside: participantsInside,
        outside: participantsOutside,
      },

      tickets: {
        sold: ticketsSold,
        revenue: ticketRevenue,
        averagePrice: ticketsSold
          ? ticketRevenue / ticketsSold
          : 0,
        entryRate,
        breakdown: ticketBreakdown,
      },

      entrances: {
        total: entrances,
        uniqueParticipants: participantsInside,
        timeline: entranceTimeline,
        peak: {
          value: peakValue,
          time: peakTime,
        },
      },

      wristbands: {
        total: wristbandsTotal,
        activated: activatedWristbands,
        inactive: inactiveWristbands,
        activationPercentage,
      },

      pos: {
        revenue: posRevenue,
        transactions: posTransactionCount,
        productsSold,
        timeline: posTimeline,
        topProducts,
        paymentMethods: posPaymentMethods,
      },

      wallet: {
        topups: walletTopups,
        spent: walletSpent,
        refunds: walletRefunds,
        averageSpend: averageWalletSpend,
      },

      event: {
        ticketRevenue,
        posRevenue,
        totalRevenue,
      },
    };

    // ---------------------------------------------------------
    // PDF
    // ---------------------------------------------------------

    const pdf = await this.pdfService.generate([
      report,
    ]);

    return {
      reports: [report],
      pdf,
    };
  }

  async generateWeeklyReports() {
  const festivals =
    await this.prisma.festival.findMany();

  const results: Awaited<
    ReturnType<
      ReportsService['generateFestivalReport']
    >
  >[] = [];

  for (const festival of festivals) {
    const report =
      await this.generateFestivalReport(
        festival.id,
      );

    results.push(report);
  }

  return results;
}
}