import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private stripe?: Stripe;
  private readonly apiUrl = process.env.API_PUBLIC_URL || 'https://infinity-eventos-api.onrender.com';
  private readonly vividFestUrl = process.env.VIVIDFEST_URL || 'https://vividfest.vercel.app/payment-success.html';

  constructor(private readonly prisma: PrismaService) {}

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

    let ticket: { id: string } | undefined;
    try {
      ticket = await this.prisma.$transaction(async (tx) => {
        const fresh = await tx.ticketCategory.updateMany({ where: { id: categoryId, sold: { lt: category.quantity } }, data: { sold: { increment: 1 } } });
        if (fresh.count !== 1) throw new BadRequestException('Biglietti esauriti');
        return tx.ticket.create({ data: { code: `VF-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, type: category.type, price: category.price, festivalId: category.festivalId, categoryId, userId, paymentStatus: 'PENDING' } });
      });
      const session = await this.client.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price_data: { currency: 'eur', product_data: { name: `${category.festival.name} · ${category.name}` }, unit_amount: Math.round(category.price * 100) }, quantity: 1 }],
        success_url: `${this.vividFestUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.vividFestUrl}/index.html#biglietti`,
        metadata: { ticketId: ticket.id, festivalId: category.festivalId, userId },
      }, { stripeAccount: category.festival.stripeAccountId });
      await this.prisma.ticket.update({ where: { id: ticket.id }, data: { stripeCheckoutSessionId: session.id } });
      return { url: session.url };
    } catch (error) {
      if (ticket) {
        await this.prisma.$transaction([
          this.prisma.ticket.delete({ where: { id: ticket.id } }),
          this.prisma.ticketCategory.update({ where: { id: categoryId }, data: { sold: { decrement: 1 } } }),
        ]);
      }
      const stripeError = error as { message?: string; code?: string; type?: string };
      console.error('Stripe Checkout error', { type: stripeError?.type, code: stripeError?.code, message: stripeError?.message });
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(stripeError?.message || 'Stripe non ha potuto creare il pagamento');
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    this.ensureConfigured();
    const event = this.client.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const ticketId = session.metadata?.ticketId;
      if (ticketId) await this.prisma.ticket.updateMany({ where: { id: ticketId, paymentStatus: 'PENDING' }, data: { paymentStatus: 'PAID', stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null } });
    }
    return { received: true };
  }
}
