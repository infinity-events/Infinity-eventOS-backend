import { Controller, Post, Body } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { PayWristbandDto } from './dto/pay-wristband.dto';
import { PayDto } from './dto/pay.dto';


@Controller('wallet')
export class WalletsController {

  constructor(
    private readonly walletsService: WalletsService
  ) {}


  @Post('topup')
  topup(
    @Body() dto: TopupWalletDto
  ){

    return this.walletsService.topup(dto);

  }


  @Post('pay-wristband')
  payWristband(
    @Body() dto: PayWristbandDto
  ){

    return this.walletsService.payByWristband(dto);

  }


  @Post('pay')
  pay(
    @Body() dto: PayDto
  ){

    return this.walletsService.pay(dto);

  }

}