import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { PosService } from './pos.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreatePosTransactionDto } from './dto/create-pos-transaction.dto';

@Controller('pos')
export class PosController {
  constructor(
    private readonly posService: PosService,
  ) {}

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────

  @Get('products/:festivalId')
  getProducts(
    @Param('festivalId') festivalId: string,
  ) {
    return this.posService.getProducts(festivalId);
  }

  @Post('products')
  createProduct(
    @Body() dto: CreateProductDto,
  ) {
    return this.posService.createProduct(dto);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.posService.updateProduct(id, dto);
  }

  // ─────────────────────────────────────────────
  // TRANSACTIONS
  // ─────────────────────────────────────────────

  @Post('transactions')
  createTransaction(
    @Body() dto: CreatePosTransactionDto,
  ) {
    return this.posService.createTransaction(dto);
  }

  @Get('transactions/:festivalId')
  getTransactions(
    @Param('festivalId') festivalId: string,
  ) {
    return this.posService.getTransactions(festivalId);
  }
}