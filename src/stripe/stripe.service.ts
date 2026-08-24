import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import Stripe from 'stripe';

import { PrismaService } from '../prisma/prisma.service';
import { TicketMailService } from '../tickets/ticket-mail.service';

@Injectable()
export class StripeService {
  private stripe?: Stripe;

  private readonly logger = new Logger(StripeService.name);

  private readonly apiUrl =
    process.env.API_PUBLIC_URL ||
    'https://infinity-eventos-api.onrender.com';

  private readonly vividFestUrl =
    process.env.VIVIDFEST_URL ||
    'https://vividfest.vercel.app';

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketMailService: TicketMailService,
  ) {}

  // ============================================================
  // STRIPE CONFIG
  // ============================================================

  private ensureConfigured() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new BadRequestException(
        'Stripe non configurato',
      );
    }
  }

  private get client() {
    this.ensureConfigured();

    this.stripe ||= new Stripe(
      process.env.STRIPE_SECRET_KEY as string,
    );

    return this.stripe;
  }

  // ============================================================
  // STRIPE CONNECT
  // ============================================================

  async createConnectLink(
    festivalId: string,
    ownerId: string,
  ) {
    this.ensureConfigured();

    const festival =
      await this.prisma.festival.findFirst({
        where: {
          id: festivalId,
          ownerId,
        },
      });

    if (!festival) {
      throw new NotFoundException(
        'Festival non trovato',
      );
    }

    const accountId =
      festival.stripeAccountId ||
      (
        await this.client.accounts.create({
          type: 'standard',

          metadata: {
            festivalId,
          },
        })
      ).id;

    if (!festival.stripeAccountId) {
      await this.prisma.festival.update({
        where: {
          id: festivalId,
        },

        data: {
          stripeAccountId: accountId,
          stripeAccountStatus: 'PENDING',
        },
      });
    }

    return this.createAccountLink(
      festivalId,
      accountId,
    );
  }

  async refreshConnectLink(
    festivalId: string,
  ) {
    this.ensureConfigured();

    const festival =
      await this.prisma.festival.findUnique({
        where: {
          id: festivalId,
        },
      });

    if (!festival?.stripeAccountId) {
      throw new NotFoundException(
        'Collegamento Stripe non iniziato',
      );
    }

    const link =
      await this.createAccountLink(
        festivalId,
        festival.stripeAccountId,
      );

    return link.url;
  }

  private async createAccountLink(
    festivalId: string,
    accountId: string,
  ) {
    return this.client.accountLinks.create({
      account: accountId,

      type: 'account_onboarding',

      refresh_url:
        `${this.apiUrl}` +
        `/festivals/${festivalId}/stripe/refresh`,

      return_url:
        `${this.vividFestUrl}` +
        `/stripe/connected?festival=${festivalId}`,

      collection_options: {
        fields: 'eventually_due',
      },
    });
  }

  async getStatus(
    festivalId: string,
    ownerId: string,
  ) {
    const festival =
      await this.prisma.festival.findFirst({
        where: {
          id: festivalId,
          ownerId,
        },
      });

    if (!festival) {
      throw new NotFoundException(
        'Festival non trovato',
      );
    }

    if (!festival.stripeAccountId) {
      return {
        connected: false,
      };
    }

    this.ensureConfigured();

    const account =
      await this.client.accounts.retrieve(
        festival.stripeAccountId,
      );

    const connected = Boolean(
      account.details_submitted &&
      account.charges_enabled,
    );

    await this.prisma.festival.update({
      where: {
        id: festivalId,
      },

      data: {
        stripeAccountStatus: connected
          ? 'CONNECTED'
          : 'PENDING',
      },
    });

    return {
      connected,

      accountId:
        festival.stripeAccountId,

      status: connected
        ? 'CONNECTED'
        : 'PENDING',
    };
  }

  // ============================================================
  // CHECKOUT
  // ============================================================

  async createCheckout(
    categoryId: string,
    userId: string,
  ) {
    this.ensureConfigured();

    const category =
      await this.prisma.ticketCategory.findUnique({
        where: {
          id: categoryId,
        },

        include: {
          festival: true,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Categoria non trovata',
      );
    }

    if (
      category.sold >=
      category.quantity
    ) {
      throw new BadRequestException(
        'Biglietti esauriti',
      );
    }

    if (
      !category.festival.stripeAccountId
    ) {
      throw new BadRequestException(
        'Questo festival non ha ancora collegato Stripe',
      );
    }

    let account: Stripe.Account;

    try {
      account =
        await this.client.accounts.retrieve(
          category.festival.stripeAccountId,
        );
    } catch (error) {
      const stripeError =
        error as {
          message?: string;
          code?: string;
          type?: string;
        };

      this.logger.error(
        'Stripe account error',
        {
          type: stripeError?.type,
          code: stripeError?.code,
          message: stripeError?.message,
        },
      );

      throw new BadRequestException(
        stripeError?.message ||
        'Account Stripe non raggiungibile',
      );
    }

    if (!account.charges_enabled) {
      throw new BadRequestException(
        'Completa la verifica dell’account Stripe prima di vendere i biglietti',
      );
    }

    try {
      const session =
        await this.client.checkout.sessions.create(
          {
            mode: 'payment',

            line_items: [
              {
                price_data: {
                  currency: 'eur',

                  product_data: {
                    name:
                      `${category.festival.name} · ` +
                      `${category.name}`,
                  },

                  unit_amount:
                    Math.round(
                      category.price * 100,
                    ),
                },

                quantity: 1,
              },
            ],

            success_url:
              `${this.vividFestUrl}` +
              `/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
              `${this.vividFestUrl}` +
              `/index.html#biglietti`,

            metadata: {
              categoryId,
              festivalId:
                category.festivalId,
              userId,
            },
          },

          {
            stripeAccount:
              category.festival.stripeAccountId,
          },
        );

      await this.prisma.ticket.create({
        data: {
          code:
            `VF-PENDING-${session.id.slice(-8)}`,

          type: category.type,

          price: category.price,

          festivalId:
            category.festivalId,

          categoryId,

          userId,

          paymentStatus: 'PENDING',

          stripeCheckoutSessionId:
            session.id,
        },
      });

      return {
        url: session.url,
      };
    } catch (error) {
      const stripeError =
        error as {
          message?: string;
          code?: string;
          type?: string;
        };

      this.logger.error(
        'Stripe Checkout error',
        {
          type: stripeError?.type,
          code: stripeError?.code,
          message: stripeError?.message,
        },
      );

      if (
        error instanceof
        BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        stripeError?.message ||
        'Stripe non ha potuto creare il pagamento',
      );
    }
  }

  // ============================================================
  // FULFILL PAID SESSION
  // ============================================================

  private async fulfillPaidSession(
    session: Stripe.Checkout.Session,
    userId: string,
    festivalId: string,
    categoryId: string,
  ) {
    /*
     * Cerchiamo prima il ticket PENDING
     * creato durante createCheckout().
     */
    const existing =
      await this.prisma.ticket.findUnique({
        where: {
          stripeCheckoutSessionId:
            session.id,
        },
      });

    // ==========================================================
    // CASO 1
    // Ticket PENDING già esistente
    // ==========================================================

    if (existing) {
      if (
        existing.userId !== userId
      ) {
        throw new BadRequestException(
          'Sessione di pagamento non associata all’utente',
        );
      }

      /*
       * Se è già PAID non dobbiamo incrementare
       * nuovamente i biglietti venduti.
       */
      if (
        existing.paymentStatus !== 'PAID'
      ) {
        const paidTicket =
          await this.prisma.$transaction(
            async (tx) => {
              const category =
                await tx.ticketCategory.findUnique(
                  {
                    where: {
                      id:
                        existing.categoryId!,
                    },
                  },
                );

              if (
                !category ||
                category.sold >=
                  category.quantity
              ) {
                throw new BadRequestException(
                  'Biglietti esauriti',
                );
              }

              await tx.ticketCategory.update(
                {
                  where: {
                    id:
                      existing.categoryId!,
                  },

                  data: {
                    sold: {
                      increment: 1,
                    },
                  },
                },
              );

              return tx.ticket.update({
                where: {
                  id: existing.id,
                },

                data: {
                  code:
                    `VF-${new Date().getFullYear()}-` +
                    `${Math.random()
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

                include: {
                  user: true,
                  festival: true,
                  category: true,
                },
              });
            },
          );

        /*
         * Il pagamento è già concluso.
         *
         * Se Resend dovesse fallire, NON facciamo
         * fallire il pagamento Stripe.
         */
        await this.sendTicketEmailSafely(
          paidTicket.id,
        );

        return paidTicket.id;
      }

      /*
       * Il ticket era già PAID.
       *
       * Controlliamo comunque se la mail non è stata
       * ancora inviata. Questo copre eventuali webhook
       * precedenti in cui Resend era temporaneamente
       * indisponibile.
       */
      await this.sendTicketEmailSafely(
        existing.id,
      );

      return existing.id;
    }

    // ==========================================================
    // CASO 2
    // Non esiste un ticket PENDING
    // ==========================================================

    const ticket =
      await this.prisma.$transaction(
        async (tx) => {
          const category =
            await tx.ticketCategory.findUnique(
              {
                where: {
                  id: categoryId,
                },
              },
            );

          if (
            !category ||
            category.sold >=
              category.quantity
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
                `VF-${new Date().getFullYear()}-` +
                `${Math.random()
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

            include: {
              user: true,
              festival: true,
              category: true,
            },
          });
        },
      );

    /*
     * Invio email dopo la creazione del ticket.
     */
    await this.sendTicketEmailSafely(
      ticket.id,
    );

    return ticket.id;
  }

  // ============================================================
  // SAFE EMAIL
  // ============================================================

  private async sendTicketEmailSafely(
    ticketId: string,
  ) {
    try {
      const result =
        await this.ticketMailService.sendTicketEmail(
          ticketId,
        );

      this.logger.log(
        `Ticket email result: ${JSON.stringify(
          result,
        )}`,
      );

      return result;
    } catch (error) {
      /*
       * IMPORTANTISSIMO:
       *
       * Il pagamento è già stato confermato.
       *
       * Un problema di Resend NON deve trasformare
       * il pagamento in un errore.
       */

      this.logger.error(
        `Errore invio email ticket ${ticketId}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return {
        sent: false,
        error: true,
      };
    }
  }

  // ============================================================
  // STRIPE WEBHOOK
  // ============================================================

  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ) {
    this.ensureConfigured();

    const event =
      this.client.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET ||
          '',
      );

    if (
      event.type ===
      'checkout.session.completed'
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const {
        categoryId,
        festivalId,
        userId,
      } = session.metadata || {};

      if (
        categoryId &&
        festivalId &&
        userId &&
        session.payment_status === 'paid'
      ) {
        await this.fulfillPaidSession(
          session,
          userId,
          festivalId,
          categoryId,
        );
      }
    }

    return {
      received: true,
    };
  }

  // ============================================================
  // VERIFY CHECKOUT
  // ============================================================

  async verifyCheckout(
    sessionId: string,
    userId: string,
  ) {
    this.ensureConfigured();

    const existing =
      await this.prisma.ticket.findUnique({
        where: {
          stripeCheckoutSessionId:
            sessionId,
        },

        include: {
          festival: true,
        },
      });

    const stripeAccountId =
      existing?.festival
        .stripeAccountId;

    if (!stripeAccountId) {
      throw new BadRequestException(
        'Sessione di pagamento non trovata',
      );
    }

    const session =
      await this.client.checkout.sessions.retrieve(
        sessionId,
        {},
        {
          stripeAccount:
            stripeAccountId,
        },
      );

    if (
      session.payment_status !== 'paid'
    ) {
      throw new BadRequestException(
        'Il pagamento non risulta completato',
      );
    }

    const metadata =
      session.metadata || {};

    const ticketId =
      await this.fulfillPaidSession(
        session,
        userId,
        metadata.festivalId || '',
        metadata.categoryId || '',
      );

    return {
      paid: true,
      ticketId,
    };
  }

  // ============================================================
  // RECONCILE PENDING TICKETS
  // ============================================================

  async reconcilePendingTickets(
    userId: string,
  ) {
    this.ensureConfigured();

    const pending =
      await this.prisma.ticket.findMany({
        where: {
          userId,

          paymentStatus: 'PENDING',

          stripeCheckoutSessionId: {
            not: null,
          },
        },

        include: {
          festival: true,
        },
      });

    for (const ticket of pending) {
      if (
        !ticket.stripeCheckoutSessionId ||
        !ticket.festival.stripeAccountId
      ) {
        continue;
      }

      try {
        const session =
          await this.client.checkout.sessions.retrieve(
            ticket.stripeCheckoutSessionId,
            {},
            {
              stripeAccount:
                ticket.festival
                  .stripeAccountId,
            },
          );

        if (
          session.payment_status ===
          'paid'
        ) {
          await this.fulfillPaidSession(
            session,
            userId,
            ticket.festivalId,
            ticket.categoryId || '',
          );
        } else if (
          session.status === 'expired' ||
          session.payment_status !== 'paid'
        ) {
          await this.prisma.ticket.update({
            where: {
              id: ticket.id,
            },

            data: {
              paymentStatus: 'FAILED',
            },
          });
        }
      } catch (error) {
        this.logger.error(
          `Pending ticket reconciliation error`,
          {
            ticketId: ticket.id,

            message:
              (
                error as {
                  message?: string;
                }
              )?.message,
          },
        );
      }
    }
  }
}