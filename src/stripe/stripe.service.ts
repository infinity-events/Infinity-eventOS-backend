import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { TicketMailService } from '../tickets/ticket-mail.service';

@Injectable()
export class StripeService {
  private stripe?: Stripe;
  private readonly apiUrl = process.env.API_PUBLIC_URL || 'https://infinity-eventos-api.onrender.com';
  private readonly vividFestUrl = process.env.VIVIDFEST_URL || 'https://vividfest.vercel.app';

  constructor(private readonly prisma: PrismaService, private readonly ticketMailService: TicketMailService,) {}

  private ensureConfigured() {
    if (!process.env.STRIPE_SECRET_KEY) throw new BadRequestException('Stripe non configurato');
  }

  private get client() {
    this.ensureConfigured();
    this.stripe ||= new Stripe(process.env.STRIPE_SECRET_KEY as string);
    return this.stripe;
  }

  async createConnectLink(festivalId: string, ownerId: string) {
    this.ensureConfigured();
    const festival = await this.prisma.festival.findFirst({ where: { id: festivalId, ownerId } });
    if (!festival) throw new NotFoundException('Festival non trovato');

    const accountId = festival.stripeAccountId || (await this.client.accounts.create({
      type: 'standard',
      metadata: { festivalId },
    })).id;

    if (!festival.stripeAccountId) {
      await this.prisma.festival.update({ where: { id: festivalId }, data: { stripeAccountId: accountId, stripeAccountStatus: 'PENDING' } });
    }
    return this.createAccountLink(festivalId, accountId);
  }

  async refreshConnectLink(festivalId: string) {
    this.ensureConfigured();
    const festival = await this.prisma.festival.findUnique({ where: { id: festivalId } });
    if (!festival?.stripeAccountId) throw new NotFoundException('Collegamento Stripe non iniziato');
    const link = await this.createAccountLink(festivalId, festival.stripeAccountId);
    return link.url;
  }

  private async createAccountLink(festivalId: string, accountId: string) {
    return this.client.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${this.apiUrl}/festivals/${festivalId}/stripe/refresh`,
      return_url: `${this.vividFestUrl}/stripe/connected?festival=${festivalId}`,
      collection_options: { fields: 'eventually_due' },
    });
  }

  async getStatus(festivalId: string, ownerId: string) {
    const festival = await this.prisma.festival.findFirst({ where: { id: festivalId, ownerId } });
    if (!festival) throw new NotFoundException('Festival non trovato');
    if (!festival.stripeAccountId) return { connected: false };
    this.ensureConfigured();
    const account = await this.client.accounts.retrieve(festival.stripeAccountId);
    const connected = Boolean(account.details_submitted && account.charges_enabled);
    await this.prisma.festival.update({ where: { id: festivalId }, data: { stripeAccountStatus: connected ? 'CONNECTED' : 'PENDING' } });
    return { connected, accountId: festival.stripeAccountId, status: connected ? 'CONNECTED' : 'PENDING' };
  }

  async createCheckout(categoryId: string, userId: string) {
    this.ensureConfigured();
    const category = await this.prisma.ticketCategory.findUnique({ where: { id: categoryId }, include: { festival: true } });
    if (!category) throw new NotFoundException('Categoria non trovata');
    if (category.sold >= category.quantity) throw new BadRequestException('Biglietti esauriti');
    if (!category.festival.stripeAccountId) throw new BadRequestException('Questo festival non ha ancora collegato Stripe');
    let account: Stripe.Account;
    try {
      account = await this.client.accounts.retrieve(category.festival.stripeAccountId);
    } catch (error) {
      const stripeError = error as { message?: string; code?: string; type?: string };
      console.error('Stripe account error', { type: stripeError?.type, code: stripeError?.code, message: stripeError?.message });
      throw new BadRequestException(stripeError?.message || 'Account Stripe non raggiungibile');
    }
    if (!account.charges_enabled) {
      throw new BadRequestException('Completa la verifica dell’account Stripe prima di vendere i biglietti');
    }

    try {
      const session = await this.client.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price_data: { currency: 'eur', product_data: { name: `${category.festival.name} · ${category.name}` }, unit_amount: Math.round(category.price * 100) }, quantity: 1 }],
        success_url: `${this.vividFestUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.vividFestUrl}/index.html#biglietti`,
        metadata: { categoryId, festivalId: category.festivalId, userId },
      }, { stripeAccount: category.festival.stripeAccountId });
      await this.prisma.ticket.create({ data: { code: `VF-PENDING-${session.id.slice(-8)}`, type: category.type, price: category.price, festivalId: category.festivalId, categoryId, userId, paymentStatus: 'PENDING', stripeCheckoutSessionId: session.id } });
      return { url: session.url };
    } catch (error) {
      const stripeError = error as { message?: string; code?: string; type?: string };
      console.error('Stripe Checkout error', { type: stripeError?.type, code: stripeError?.code, message: stripeError?.message });
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(stripeError?.message || 'Stripe non ha potuto creare il pagamento');
    }
  }

  private async fulfillPaidSession(
  session: Stripe.Checkout.Session,
  userId: string,
  festivalId: string,
  categoryId: string,
) {
  const existing =
    await this.prisma.ticket.findUnique({
      where: {
        stripeCheckoutSessionId: session.id,
      },
    });

  if (existing) {
    if (existing.userId !== userId) {
      throw new BadRequestException(
        'Sessione di pagamento non associata all’utente',
      );
    }

    if (
      existing.paymentStatus !== 'PAID'
    ) {
      await this.prisma.$transaction(
        async (tx) => {
          const category =
            await tx.ticketCategory.findUnique({
              where: {
                id: existing.categoryId!,
              },
            });

          if (
            !category ||
            category.sold >= category.quantity
          ) {
            throw new BadRequestException(
              'Biglietti esauriti',
            );
          }

          await tx.ticketCategory.update({
            where: {
              id: existing.categoryId!,
            },

            data: {
              sold: {
                increment: 1,
              },
            },
          });

          await tx.ticket.update({
            where: {
              id: existing.id,
            },

            data: {
              code:
                `VF-${new Date().getFullYear()}-${Math.random()
                  .toString(36)
                  .substring(2, 8)
                  .toUpperCase()}`,

              paymentStatus: 'PAID',

              stripePaymentIntentId:
                typeof session.payment_intent ===
                'string'
                  ? session.payment_intent
                  : null,
            },
          });
        },
      );

      return {
        ticketId: existing.id,
        newlyPaid: true,
      };
    }

    return {
      ticketId: existing.id,
      newlyPaid: false,
    };
  }

  const ticket =
    await this.prisma.$transaction(
      async (tx) => {
        const category =
          await tx.ticketCategory.findUnique({
            where: {
              id: categoryId,
            },
          });

        if (
          !category ||
          category.sold >= category.quantity
        ) {
          throw new BadRequestException(
            'Biglietti esauriti',
          );
        }

        await tx.ticketCategory.update({
          where: {
            id: categoryId,
          },

          data: {
            sold: {
              increment: 1,
            },
          },
        });

        return tx.ticket.create({
          data: {
            code:
              `VF-${new Date().getFullYear()}-${Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()}`,

            type: category.type,

            price: category.price,

            festivalId,

            categoryId,

            userId,

            paymentStatus: 'PAID',

            stripeCheckoutSessionId:
              session.id,

            stripePaymentIntentId:
              typeof session.payment_intent ===
              'string'
                ? session.payment_intent
                : null,
          },
        });
      },
    );

  return {
    ticketId: ticket.id,
    newlyPaid: true,
  };
}

  async handleWebhook(rawBody: Buffer, signature: string) {
    this.ensureConfigured();
    const event = this.client.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { categoryId, festivalId, userId } = session.metadata || {};
      if (
  categoryId &&
  festivalId &&
  userId &&
  session.payment_status === 'paid'
) {
  const result =
    await this.fulfillPaidSession(
      session,
      userId,
      festivalId,
      categoryId,
    );

  if (result.newlyPaid) {
    try {
      await this.ticketMailService.sendTicketEmail(
        result.ticketId,
      );
    } catch (error) {
      console.error(
        'Errore invio email ticket:',
        error,
      );
    }
  }
}
    }
    return { received: true };
  }

  async verifyCheckout(sessionId: string, userId: string) {
    this.ensureConfigured();
    const existing = await this.prisma.ticket.findUnique({ where: { stripeCheckoutSessionId: sessionId }, include: { festival: true } });
    let stripeAccountId = existing?.festival.stripeAccountId;
    if (!stripeAccountId) throw new BadRequestException('Sessione di pagamento non trovata');
    const session = await this.client.checkout.sessions.retrieve(sessionId, {}, { stripeAccount: stripeAccountId });
    if (session.payment_status !== 'paid') throw new BadRequestException('Il pagamento non risulta completato');
    const metadata = session.metadata || {};
    const result =
  await this.fulfillPaidSession(
    session,
    userId,
    metadata.festivalId || '',
    metadata.categoryId || '',
  );

if (result.newlyPaid) {
  try {
    await this.ticketMailService.sendTicketEmail(
      result.ticketId,
    );
  } catch (error) {
    console.error(
      'Errore invio email ticket:',
      error,
    );
  }
}

return {
  paid: true,
  ticketId: result.ticketId,
};
  }

  async reconcilePendingTickets(userId: string) {
    this.ensureConfigured();
    const pending = await this.prisma.ticket.findMany({ where: { userId, paymentStatus: 'PENDING', stripeCheckoutSessionId: { not: null } }, include: { festival: true } });
    for (const ticket of pending) {
      if (!ticket.stripeCheckoutSessionId || !ticket.festival.stripeAccountId) continue;
      try {
        const session = await this.client.checkout.sessions.retrieve(ticket.stripeCheckoutSessionId, {}, { stripeAccount: ticket.festival.stripeAccountId });
        if (session.payment_status === 'paid') {
          await this.fulfillPaidSession(session, userId, ticket.festivalId, ticket.categoryId || '');
        } else if (session.status === 'expired' || session.payment_status !== 'paid') {
          await this.prisma.ticket.update({ where: { id: ticket.id }, data: { paymentStatus: 'FAILED' } });
        }
      } catch (error) {
        console.error('Pending ticket reconciliation error', { ticketId: ticket.id, message: (error as { message?: string })?.message });
      }
    }
  }
}
