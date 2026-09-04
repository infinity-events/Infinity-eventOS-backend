import { Injectable } from '@nestjs/common';
import { EntranceAction, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getAnalytics(festivalId: string) {
    // ============================================================
    // TICKETS
    // ============================================================

    const tickets = await this.prisma.ticket.findMany({
      where: {
        festivalId,
        paymentStatus: 'PAID',
        status: {
          not: TicketStatus.CANCELLED,
        },
      },
      select: {
        id: true,
        type: true,
        price: true,
        userId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const ticketCategories: Record<string, number> = {};

    tickets.forEach((ticket) => {
      if (!ticketCategories[ticket.type]) {
        ticketCategories[ticket.type] = 0;
      }

      ticketCategories[ticket.type]++;
    });

    const ticketRevenue = tickets.reduce(
      (sum, ticket) => sum + ticket.price,
      0,
    );

    // ============================================================
    // ENTRANCES
    // ============================================================

    const entranceLogs = await this.prisma.entranceLog.findMany({
      where: {
        festivalId,
        action: EntranceAction.ENTRY,
        ticket: {
          status: {
            not: TicketStatus.CANCELLED,
          },
          paymentStatus: 'PAID',
        },
      },
      select: {
        id: true,
        ticketId: true,
        userId: true,
        createdAt: true,
        method: true,
        gate: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    /*
     * Un ticket può teoricamente avere più log.
     * Per sapere quante PERSONE sono effettivamente dentro
     * consideriamo ogni ticket una sola volta.
     */
    const enteredTicketIds = new Set<string>();

    entranceLogs.forEach((log) => {
      enteredTicketIds.add(log.ticketId);
    });

    const participantsTotal = tickets.length;

    const participantsInside = enteredTicketIds.size;

    const participantsOutside = Math.max(
      participantsTotal - participantsInside,
      0,
    );

    // ============================================================
    // ENTRANCE TIMELINE
    // ============================================================

    /*
     * Raggruppiamo gli ingressi per ora.
     *
     * Esempio:
     * 21:00 -> 32
     * 22:00 -> 87
     * 23:00 -> 145
     */

    const timelineMap: Record<string, number> = {};

    entranceLogs.forEach((log) => {
      const date = new Date(log.createdAt);

      const hour = date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (!timelineMap[hour]) {
        timelineMap[hour] = 0;
      }

      timelineMap[hour]++;
    });

    const entranceTimeline = Object.entries(timelineMap).map(
      ([time, value]) => ({
        time,
        value,
      }),
    );

    // ============================================================
    // PEAK ENTRANCES
    // ============================================================

    let peakEntrances = 0;
    let peakTime: string | null = null;

    entranceTimeline.forEach((point) => {
      if (point.value > peakEntrances) {
        peakEntrances = point.value;
        peakTime = point.time;
      }
    });

    // ============================================================
    // POS
    // ============================================================

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
      (sum, transaction) => sum + transaction.total,
      0,
    );

    // ============================================================
    // TOP PRODUCTS
    // ============================================================

    const productsMap: Record<
      string,
      {
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
      }
    > = {};

    posTransactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        if (!productsMap[item.productId]) {
          productsMap[item.productId] = {
            productId: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }

        productsMap[item.productId].quantity += item.quantity;
        productsMap[item.productId].revenue += item.subtotal;
      });
    });

    const topProducts = Object.values(productsMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // ============================================================
    // POS TIMELINE
    // ============================================================

    const posTimelineMap: Record<string, number> = {};

    posTransactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);

      const hour = date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (!posTimelineMap[hour]) {
        posTimelineMap[hour] = 0;
      }

      posTimelineMap[hour] += transaction.total;
    });

    const posTimeline = Object.entries(posTimelineMap).map(
      ([time, value]) => ({
        time,
        value,
      }),
    );

    // ============================================================
    // WALLET
    // ============================================================

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
      include: {
        transactions: {
          where: {
            festivalId,
          },
        },
      },
    });

    let topups = 0;
    let spent = 0;
    let refunds = 0;

    wallets.forEach((wallet) => {
      wallet.transactions.forEach((transaction) => {
        if (transaction.type === 'TOPUP') {
          topups += transaction.amount;
        }

        if (transaction.type === 'PURCHASE') {
          spent += transaction.amount;
        }

        if (transaction.type === 'REFUND') {
          refunds += transaction.amount;
        }
      });
    });

    // ============================================================
    // WRISTBANDS
    // ============================================================

    const wristbands = await this.prisma.wristband.findMany({
      where: {
        festivalId,
      },
      select: {
        id: true,
        activated: true,
      },
    });

    const activatedWristbands = wristbands.filter(
      (wristband) => wristband.activated,
    ).length;

    // ============================================================
    // TOTAL REVENUE
    // ============================================================

    const totalRevenue = ticketRevenue + posRevenue;

    // ============================================================
    // AVERAGES / KPIs
    // ============================================================

    const averageWalletSpend =
      participantsTotal > 0
        ? spent / participantsTotal
        : 0;

    const activationPercentage =
      participantsTotal > 0
        ? Math.round(
            (activatedWristbands / participantsTotal) * 100,
          )
        : 0;

    // ============================================================
    // RESULT
    // ============================================================

    return {
      participants: {
        total: participantsTotal,
        inside: participantsInside,
        outside: participantsOutside,
      },

      tickets: {
        sold: tickets.length,
        revenue: ticketRevenue,
        categories: ticketCategories,
      },

      entrances: {
        total: entranceLogs.length,
        timeline: entranceTimeline,
        peak: {
          value: peakEntrances,
          time: peakTime,
        },
      },

      pos: {
        revenue: posRevenue,
        transactions: posTransactions.length,
        timeline: posTimeline,
        topProducts,
      },

      wallet: {
        topups,
        spent,
        refunds,
        averageSpend: averageWalletSpend,
      },

      wristbands: {
        total: wristbands.length,
        activated: activatedWristbands,
        activationPercentage,
      },

      event: {
        totalRevenue,
      },
    };
  }
}