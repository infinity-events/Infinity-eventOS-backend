import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  CreatePosTransactionDto,
} from './dto/create-pos-transaction.dto';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================
  // PRODUCTS
  // ============================================================

  async getProducts(festivalId: string) {
    return this.prisma.product.findMany({
      where: {
        festivalId,
        status: 'ACTIVE',
      },

      orderBy: [
        {
          category: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async createProduct(
    dto: CreateProductDto,
  ) {
    const festival =
      await this.prisma.festival.findUnique({
        where: {
          id: dto.festivalId,
        },
      });

    if (!festival) {
      throw new NotFoundException(
        'Festival non trovato',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const product =
          await tx.product.create({
            data: {
              festivalId: dto.festivalId,
              name: dto.name,
              description: dto.description,
              imageUrl: dto.imageUrl,
              category: dto.category,
              price: dto.price,
              stock: dto.stock,
            },
          });

        if (dto.stock > 0) {
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              festivalId: dto.festivalId,
              type: 'INITIAL',
              quantity: dto.stock,
              stockBefore: 0,
              stockAfter: dto.stock,
              note: 'Stock iniziale',
            },
          });
        }

        return product;
      },
    );
  }

  async updateProduct(
    productId: string,
    dto: UpdateProductDto,
  ) {
    const existing =
      await this.prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Prodotto non trovato',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const newStock =
          dto.stock ?? existing.stock;

        const product =
          await tx.product.update({
            where: {
              id: productId,
            },

            data: {
              name: dto.name,
              description: dto.description,
              imageUrl: dto.imageUrl,
              category: dto.category,
              price: dto.price,
              stock: dto.stock,
            },
          });

        // Se è cambiato lo stock, registriamo
        // sempre un movimento.
        if (
          dto.stock !== undefined &&
          dto.stock !== existing.stock
        ) {
          await tx.stockMovement.create({
            data: {
              productId,
              festivalId:
                existing.festivalId,

              type: 'ADJUSTMENT',

              quantity:
                newStock - existing.stock,

              stockBefore:
                existing.stock,

              stockAfter:
                newStock,

              note: 'Modifica manuale dello stock',
            },
          });
        }

        return product;
      },
    );
  }

  // ============================================================
  // POS TRANSACTIONS
  // ============================================================

  async createTransaction(
    dto: CreatePosTransactionDto,
  ) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'Il carrello è vuoto',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        // ------------------------------------------------------
        // 1. Recuperiamo i prodotti
        // ------------------------------------------------------

        const productIds = dto.items.map(
          (item) => item.productId,
        );

        const products =
          await tx.product.findMany({
            where: {
              id: {
                in: productIds,
              },

              festivalId:
                dto.festivalId,

              status: 'ACTIVE',
            },
          });

        // ------------------------------------------------------
        // 2. Controlliamo che esistano tutti
        // ------------------------------------------------------

        if (
          products.length !==
          productIds.length
        ) {
          throw new BadRequestException(
            'Uno o più prodotti non sono disponibili',
          );
        }

        // ------------------------------------------------------
        // 3. Calcoliamo totale e verifichiamo stock
        // ------------------------------------------------------

        let total = 0;

        const transactionItems: {
          productId: string;
          productName: string;
          unitPrice: number;
          quantity: number;
          subtotal: number;
        }[] = [];

        for (const item of dto.items) {
          const product =
            products.find(
              (p) =>
                p.id ===
                item.productId,
            );

          if (!product) {
            throw new BadRequestException(
              'Prodotto non trovato',
            );
          }

          if (
            product.stock <
            item.quantity
          ) {
            throw new BadRequestException(
              `Stock insufficiente per ${product.name}. Disponibili: ${product.stock}`,
            );
          }

          const subtotal =
            product.price *
            item.quantity;

          total += subtotal;

          transactionItems.push({
            productId:
              product.id,

            productName:
              product.name,

            unitPrice:
              product.price,

            quantity:
              item.quantity,

            subtotal,
          });
        }

        // ------------------------------------------------------
        // 4. Creiamo la transazione POS
        // ------------------------------------------------------

        const transaction =
          await tx.posTransaction.create({
            data: {
              festivalId:
                dto.festivalId,

              total,

              paymentMethod:
                dto.paymentMethod,

              operatorId:
                dto.operatorId ??
                null,

              items: {
                create:
                  transactionItems,
              },
            },

            include: {
              items: true,
            },
          });

        // ------------------------------------------------------
        // 5. Scarichiamo lo stock
        // ------------------------------------------------------

        for (const item of dto.items) {
          const product =
            products.find(
              (p) =>
                p.id ===
                item.productId,
            );

          if (!product) {
            continue;
          }

          const stockBefore =
            product.stock;

          const stockAfter =
            stockBefore -
            item.quantity;

          await tx.product.update({
            where: {
              id: product.id,
            },

            data: {
              stock: stockAfter,
            },
          });

          await tx.stockMovement.create({
            data: {
              productId:
                product.id,

              festivalId:
                dto.festivalId,

              type: 'SALE',

              quantity:
                -item.quantity,

              stockBefore,

              stockAfter,

              note:
                `Vendita POS ${transaction.id}`,
            },
          });
        }

        // ------------------------------------------------------
        // 6. Restituiamo la transazione
        // ------------------------------------------------------

        return transaction;
      },
    );
  }

  // ============================================================
  // TRANSACTION HISTORY
  // ============================================================

  async getTransactions(
    festivalId: string,
  ) {
    return this.prisma.posTransaction.findMany({
      where: {
        festivalId,
      },

      include: {
        items: true,

        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}