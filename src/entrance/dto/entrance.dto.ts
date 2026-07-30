export class EntranceQrDto {
  festivalId: string;
  code: string;
  operatorId?: string;
}

export class EntranceNfcDto {
  festivalId: string;
  uid: string;
  operatorId?: string;
}

export class EntranceManualDto {
  festivalId: string;
  query: string;
  operatorId?: string;
}
