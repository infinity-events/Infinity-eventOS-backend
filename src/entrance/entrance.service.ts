import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntranceMethod, Ticket, TicketStatus, Wristband } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntranceManualDto, EntranceNfcDto, EntranceQrDto } from './dto/entrance.dto';

type TicketWithRelations = Ticket & {
  wristband: Wristband | null;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
};

type WristbandWithTicket = Wristband & {
  ticket: TicketWithRelations | null;
};

@Injectable()
export class EntranceService {
  constructor(private prisma: PrismaService) {}

  async checkQr(dto: EntranceQrDto) {
    const code = dto.code?.trim();

    if (!dto.festivalId || !code) {
      throw new BadRequestException('Festival e codice biglietto sono obbligatori');
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        festivalId: dto.festivalId,
        code,
      },
      include: {
        wristband: true,
        user: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Biglietto non valido');
    }

    return this.registerEntrance(ticket, EntranceMethod.QR, dto.operatorId);
  }

  async checkNfc(dto: EntranceNfcDto) {
    const uid = dto.uid?.trim();

    if (!dto.festivalId || !uid) {
      throw new BadRequestException('Festival e UID NFC sono obbligatori');
    }

    const wristband = await this.prisma.wristband.findFirst({
      where: {
        festivalId: dto.festivalId,
        OR: [
          { uid },
          { code: uid },
          { activationCode: uid },
        ],
      },
      include: {
        ticket: {
          include: {
            wristband: true,
            user: true,
          },
        },
      },
    });

    if (!wristband) {
      throw new NotFoundException('Braccialetto non trovato');
    }

    if (!wristband.activated) {
      throw new BadRequestException('Braccialetto non attivato');
    }

    if (!wristband.ticket) {
      throw new BadRequestException('Braccialetto senza biglietto associato');
    }

    return this.registerEntrance(
      this.ticketFromWristband(wristband),
      EntranceMethod.NFC,
      dto.operatorId,
      wristband.id,
    );
  }

  async checkManual(dto: EntranceManualDto) {
    const query = dto.query?.trim();

    if (!dto.festivalId || !query) {
      throw new BadRequestException('Festival e ricerca sono obbligatori');
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        festivalId: dto.festivalId,
        OR: [
          { code: query },
          { user: { firstName: { contains: query } } },
          { user: { lastName: { contains: query } } },
          { user: { email: { contains: query } } },
          { wristband: { uid: query } },
          { wristband: { code: query } },
          { wristband: { activationCode: query } },
        ],
      },
      include: {
        wristband: true,
        user: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Nessun biglietto o braccialetto trovato');
    }

    return this.registerEntrance(ticket, EntranceMethod.MANUAL, dto.operatorId);
  }

  logs(festivalId: string) {
    return this.prisma.entranceLog.findMany({
      where: {
        festivalId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        ticket: true,
        wristband: true,
        user: true,
        operator: true,
      },
    });
  }

  async stats(festivalId: string) {
    const [totalTickets, inside, lastLog] = await Promise.all([
      this.prisma.ticket.count({
        where: {
          festivalId,
          status: {
            not: TicketStatus.CANCELLED,
          },
        },
      }),
      this.prisma.entranceLog.count({
        where: {
          festivalId,
        },
      }),
      this.prisma.entranceLog.findFirst({
        where: {
          festivalId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      totalTickets,
      inside,
      waiting: Math.max(totalTickets - inside, 0),
      lastEntranceAt: lastLog?.createdAt ?? null,
    };
  }

  private async registerEntrance(
    ticket: TicketWithRelations,
    method: EntranceMethod,
    operatorId?: string,
    wristbandId?: string,
  ) {
    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Biglietto annullato');
    }

    const existingLog = await this.prisma.entranceLog.findFirst({
      where: {
        ticketId: ticket.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        ticket: true,
        wristband: true,
        user: true,
        operator: true,
      },
    });

    if (existingLog || ticket.status === TicketStatus.USED) {
      return {
        valid: true,
        allowed: false,
        alreadyChecked: true,
        message: 'Biglietto gia utilizzato',
        log: existingLog,
        ticket,
      };
    }

    const log = await this.prisma.$transaction(async (tx) => {
      const entranceLog = await tx.entranceLog.create({
        data: {
          festivalId: ticket.festivalId,
          ticketId: ticket.id,
          wristbandId: wristbandId ?? ticket.wristband?.id,
          userId: ticket.userId,
          operatorId,
          method,
        },
        include: {
          ticket: true,
          wristband: true,
          user: true,
          operator: true,
        },
      });

      await tx.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          status: TicketStatus.USED,
        },
      });

      return entranceLog;
    });

    return {
      valid: true,
      allowed: true,
      alreadyChecked: false,
      message: 'Accesso consentito',
      log,
      ticket,
    };
  }

  private ticketFromWristband(wristband: WristbandWithTicket): TicketWithRelations {
    if (!wristband.ticket) {
      throw new BadRequestException('Braccialetto senza biglietto associato');
    }

    return {
      ...wristband.ticket,
      wristband,
    };
  }
}
