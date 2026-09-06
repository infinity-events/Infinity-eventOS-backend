import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { InventoryService } from './inventory.service';

import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('inventory')
@UseGuards(
  FirebaseAuthGuard,
  RolesGuard,
)
@Roles(Role.ADMIN)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  // ============================================================
  // STATS
  // ============================================================

  @Get('stats')
  getStats() {
    return this.inventoryService.getStats();
  }

  // ============================================================
  // ASSETS
  // ============================================================

  @Get('assets')
  getAssets() {
    return this.inventoryService.getAssets();
  }

  @Get('assets/:assetCode')
  getAsset(
    @Param('assetCode') assetCode: string,
  ) {
    return this.inventoryService.getAssetByCode(
      assetCode,
    );
  }

  @Post('assets')
  createAsset(
    @Body()
    body: {
      name: string;
      description?: string;
      category?: string;
      serialNumber?: string;
    },
    @Req() req: any,
  ) {
    return this.inventoryService.createAsset(
      body,
      req.user.id,
    );
  }

  // ============================================================
  // RENTALS
  // ============================================================

  @Get('rentals')
  getRentals() {
    return this.inventoryService.getRentals();
  }

  @Get('rentals/:id')
  getRental(
    @Param('id') id: string,
  ) {
    return this.inventoryService.getRental(id);
  }

  @Post('rentals')
  createRental(
    @Body()
    body: {
      assetCodes: string[];
      customerName: string;
      customerCompany?: string;
      customerEmail?: string;
      customerPhone?: string;
      notes?: string;
      expectedReturnAt?: string;
    },
    @Req() req: any,
  ) {
    return this.inventoryService.createRental(
      body,
      req.user.id,
    );
  }

  // ============================================================
  // RETURN
  // ============================================================

  @Post(
    'assets/:assetCode/return',
  )
  returnAsset(
    @Param('assetCode') assetCode: string,
    @Req() req: any,
  ) {
    return this.inventoryService.returnAsset(
      assetCode,
      req.user.id,
    );
  }

  // ============================================================
  // HISTORY
  // ============================================================

  @Get('movements')
  getMovements() {
    return this.inventoryService.getMovements();
  }
}