import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EntranceManualDto, EntranceNfcDto, EntranceQrDto } from './dto/entrance.dto';
import { EntranceService } from './entrance.service';

@Controller('entrance')
export class EntranceController {
  constructor(private service: EntranceService) {}

  @Post('qr')
  checkQr(@Body() dto: EntranceQrDto) {
    return this.service.checkQr(dto);
  }

  @Post('nfc')
  checkNfc(@Body() dto: EntranceNfcDto) {
    return this.service.checkNfc(dto);
  }

  @Post('manual')
  checkManual(@Body() dto: EntranceManualDto) {
    return this.service.checkManual(dto);
  }

  @Get('logs/:festivalId')
  logs(@Param('festivalId') festivalId: string) {
    return this.service.logs(festivalId);
  }

  @Get('stats/:festivalId')
  stats(@Param('festivalId') festivalId: string) {
    return this.service.stats(festivalId);
  }
}
