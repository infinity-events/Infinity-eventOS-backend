import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InventoryAssetStatus,
  InventoryMovementType,
  RentalStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
  ) {}

  // ============================================================
  // ASSETS
  // ============================================================

  async getAssets() {
    return this.prisma.inventoryAsset.findMany({
      orderBy: {
        assetCode: 'asc',
      },
      include: {
        rentalItems: {
          where: {
            returnedAt: null,
            rental: {
              status: RentalStatus.ACTIVE,
            },
          },
          include: {
            rental: true,
          },
        },
      },
    });
  }

  async getAssetByCode(assetCode: string) {
    const asset = await this.prisma.inventoryAsset.findUnique({
      where: {
        assetCode,
      },
      include: {
        rentalItems: {
          where: {
            returnedAt: null,
            rental: {
              status: RentalStatus.ACTIVE,
            },
          },
          include: {
            rental: true,
          },
        },
        movements: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(
        'Asset non trovato',
      );
    }

    return asset;
  }

  async createAsset(
    data: {
      name: string;
      description?: string;
      category?: string;
      serialNumber?: string;
    },
    operatorId?: string,
  ) {
    const assetCode =
      await this.generateAssetCode();

    const asset =
      await this.prisma.inventoryAsset.create({
        data: {
          assetCode,
          name: data.name,
          description: data.description,
          category: data.category,
          serialNumber: data.serialNumber,
        },
      });

    await this.prisma.inventoryMovement.create({
      data: {
        assetId: asset.id,
        type: InventoryMovementType.CREATED,
        operatorId,
        note: 'Asset creato',
      },
    });

    return asset;
  }

  async deleteAsset(assetCode: string) {
  const asset =
    await this.prisma.inventoryAsset.findUnique({
      where: {
        assetCode,
      },
      include: {
        rentalItems: true,
        movements: true,
      },
    });

  if (!asset) {
    throw new NotFoundException(
      'Asset non trovato',
    );
  }

  if (asset.status === 'RENTED') {
    throw new BadRequestException(
      'Non puoi eliminare un asset attualmente noleggiato.',
    );
  }

  if (asset.rentalItems.length > 0) {
    throw new BadRequestException(
      'Non puoi eliminare un asset con uno storico di noleggi.',
    );
  }

  if (asset.movements.length > 0) {
    throw new BadRequestException(
      'Non puoi eliminare un asset con uno storico di movimenti.',
    );
  }

  await this.prisma.inventoryAsset.delete({
    where: {
      assetCode,
    },
  });

  return {
    success: true,
    message: 'Asset eliminato correttamente',
  };
}

  // ============================================================
  // RENTALS
  // ============================================================

  async createRental(
    data: {
      assetCodes: string[];
      customerName: string;
      customerCompany?: string;
      customerEmail?: string;
      customerPhone?: string;
      notes?: string;
      expectedReturnAt?: string;
    },
    operatorId?: string,
  ) {
    if (
      !data.assetCodes ||
      data.assetCodes.length === 0
    ) {
      throw new BadRequestException(
        'Nessun asset selezionato',
      );
    }

    const uniqueCodes = [
      ...new Set(data.assetCodes),
    ];

    const assets =
      await this.prisma.inventoryAsset.findMany({
        where: {
          assetCode: {
            in: uniqueCodes,
          },
        },
      });

    if (assets.length !== uniqueCodes.length) {
      throw new NotFoundException(
        'Uno o più asset non sono stati trovati',
      );
    }

    const unavailable = assets.filter(
      asset =>
        asset.status !==
        InventoryAssetStatus.AVAILABLE,
    );

    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Asset non disponibili: ${unavailable
          .map(asset => asset.assetCode)
          .join(', ')}`,
      );
    }

    return this.prisma.$transaction(
      async tx => {
        const rental =
          await tx.rental.create({
            data: {
              customerName:
                data.customerName,
              customerCompany:
                data.customerCompany,
              customerEmail:
                data.customerEmail,
              customerPhone:
                data.customerPhone,
              notes: data.notes,
              expectedReturnAt:
                data.expectedReturnAt
                  ? new Date(
                      data.expectedReturnAt,
                    )
                  : undefined,
              operatorId,
            },
          });

        for (const asset of assets) {
          await tx.rentalItem.create({
            data: {
              rentalId: rental.id,
              assetId: asset.id,
            },
          });

          await tx.inventoryAsset.update({
            where: {
              id: asset.id,
            },
            data: {
              status:
                InventoryAssetStatus.RENTED,
            },
          });

          await tx.inventoryMovement.create({
            data: {
              assetId: asset.id,
              rentalId: rental.id,
              operatorId,
              type:
                InventoryMovementType.RENTED,
              note: `Noleggiato a ${data.customerName}`,
            },
          });
        }

        return tx.rental.findUnique({
          where: {
            id: rental.id,
          },
          include: {
            items: {
              include: {
                asset: true,
              },
            },
          },
        });
      },
    );
  }

  async returnAsset(
    assetCode: string,
    operatorId?: string,
  ) {
    const asset =
      await this.prisma.inventoryAsset.findUnique({
        where: {
          assetCode,
        },
        include: {
          rentalItems: {
            where: {
              returnedAt: null,
              rental: {
                status: RentalStatus.ACTIVE,
              },
            },
            include: {
              rental: true,
            },
          },
        },
      });

    if (!asset) {
      throw new NotFoundException(
        'Asset non trovato',
      );
    }

    if (
      asset.status !==
      InventoryAssetStatus.RENTED
    ) {
      throw new BadRequestException(
        'Questo asset non risulta noleggiato',
      );
    }

    const activeItem =
      asset.rentalItems[0];

    if (!activeItem) {
      throw new BadRequestException(
        'Noleggio attivo non trovato',
      );
    }

    return this.prisma.$transaction(
      async tx => {
        await tx.rentalItem.update({
          where: {
            id: activeItem.id,
          },
          data: {
            returnedAt: new Date(),
          },
        });

        const remaining =
          await tx.rentalItem.count({
            where: {
              rentalId:
                activeItem.rentalId,
              returnedAt: null,
            },
          });

        if (remaining === 0) {
          await tx.rental.update({
            where: {
              id: activeItem.rentalId,
            },
            data: {
              status:
                RentalStatus.RETURNED,
              returnedAt: new Date(),
            },
          });
        }

        await tx.inventoryAsset.update({
          where: {
            id: asset.id,
          },
          data: {
            status:
              InventoryAssetStatus.AVAILABLE,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            assetId: asset.id,
            rentalId: activeItem.rentalId,
            operatorId,
            type:
              InventoryMovementType.RETURNED,
            note: 'Asset restituito',
          },
        });

        return tx.inventoryAsset.findUnique({
          where: {
            id: asset.id,
          },
        });
      },
    );
  }

  // ============================================================
  // RENTALS LIST
  // ============================================================

  async getRentals() {
    return this.prisma.rental.findMany({
      orderBy: {
        rentedAt: 'desc',
      },
      include: {
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            asset: true,
          },
        },
      },
    });
  }

  async getRental(id: string) {
    const rental =
      await this.prisma.rental.findUnique({
        where: {
          id,
        },
        include: {
          operator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              asset: true,
            },
          },
          movements: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

    if (!rental) {
      throw new NotFoundException(
        'Noleggio non trovato',
      );
    }

    return rental;
  }

  // ============================================================
  // HISTORY
  // ============================================================

  async getMovements() {
    return this.prisma.inventoryMovement.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        asset: true,
        rental: true,
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // ============================================================
  // STATS
  // ============================================================

  async getStats() {
    const [
      total,
      available,
      rented,
      maintenance,
      lost,
      activeRentals,
    ] = await Promise.all([
      this.prisma.inventoryAsset.count(),

      this.prisma.inventoryAsset.count({
        where: {
          status:
            InventoryAssetStatus.AVAILABLE,
        },
      }),

      this.prisma.inventoryAsset.count({
        where: {
          status:
            InventoryAssetStatus.RENTED,
        },
      }),

      this.prisma.inventoryAsset.count({
        where: {
          status:
            InventoryAssetStatus.MAINTENANCE,
        },
      }),

      this.prisma.inventoryAsset.count({
        where: {
          status:
            InventoryAssetStatus.LOST,
        },
      }),

      this.prisma.rental.count({
        where: {
          status: RentalStatus.ACTIVE,
        },
      }),
    ]);

    return {
      total,
      available,
      rented,
      maintenance,
      lost,
      activeRentals,
    };
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  private async generateAssetCode() {
    const last =
      await this.prisma.inventoryAsset.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          assetCode: true,
        },
      });

    if (!last) {
      return 'INV-000001';
    }

    const match =
      last.assetCode.match(
        /^INV-(\d+)$/,
      );

    if (!match) {
      return 'INV-000001';
    }

    const next =
      Number(match[1]) + 1;

    return `INV-${String(next).padStart(
      6,
      '0',
    )}`;
  }
}