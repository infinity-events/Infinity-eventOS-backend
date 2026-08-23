import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export enum PosPaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export class PosTransactionItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePosTransactionDto {
  @IsString()
  festivalId: string;

  @IsEnum(PosPaymentMethod)
  paymentMethod: PosPaymentMethod;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosTransactionItemDto)
  items: PosTransactionItemDto[];
}