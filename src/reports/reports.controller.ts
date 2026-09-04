import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { ReportsService } from './reports.service';
import { ReportsMailService } from './reports.mail';
import { PrismaService } from '../prisma/prisma.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsMailService: ReportsMailService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('generate/:festivalId')
  async generate(
    @Param('festivalId') festivalId: string,
  ) {
    const festival =
      await this.prisma.festival.findUnique({
        where: {
          id: festivalId,
        },
      });

    if (!festival) {
      throw new NotFoundException(
        'Festival non trovato',
      );
    }

    if (!festival.reportEmail) {
      throw new BadRequestException(
        'Email report non configurata',
      );
    }

    const report =
      await this.reportsService.generateFestivalReport(
        festivalId,
      );

    await this.reportsMailService.sendReport(
      festival.reportEmail,
      report.pdf,
      report.reports[0],
    );

    return {
      message:
        'Report generato e inviato',
      report: report.reports[0],
    };
  }

  @Post('email-test/:festivalId')
  async emailTest(
    @Param('festivalId') festivalId: string,
  ) {
    const festival =
      await this.prisma.festival.findUnique({
        where: {
          id: festivalId,
        },
      });

    if (!festival) {
      throw new NotFoundException(
        'Festival non trovato',
      );
    }

    if (!festival.reportEmail) {
      throw new BadRequestException(
        'Email report non configurata',
      );
    }

    const report =
      await this.reportsService.generateFestivalReport(
        festivalId,
      );

    await this.reportsMailService.sendReport(
      festival.reportEmail,
      report.pdf,
      report.reports[0],
    );

    return {
      message:
        'Email di test inviata',
    };
  }

  @Post('email/:festivalId')
  async saveEmail(
    @Param('festivalId') festivalId: string,
    @Body() body: { email: string },
  ) {
    if (
      !body?.email ||
      !body.email.includes('@')
    ) {
      throw new BadRequestException(
        'Email non valida',
      );
    }

    const festival =
      await this.prisma.festival.findUnique({
        where: {
          id: festivalId,
        },
      });

    if (!festival) {
      throw new NotFoundException(
        'Festival non trovato',
      );
    }

    return this.prisma.festival.update({
      where: {
        id: festivalId,
      },
      data: {
        reportEmail:
          body.email.trim(),
      },
      select: {
        id: true,
        reportEmail: true,
      },
    });
  }

  @Get('email/:festivalId')
  async getEmail(
    @Param('festivalId') festivalId: string,
  ) {
    const festival =
      await this.prisma.festival.findUnique({
        where: {
          id: festivalId,
        },
        select: {
          reportEmail: true,
        },
      });

    if (!festival) {
      throw new NotFoundException(
        'Festival non trovato',
      );
    }

    return {
      email:
        festival.reportEmail || '',
    };
  }
}