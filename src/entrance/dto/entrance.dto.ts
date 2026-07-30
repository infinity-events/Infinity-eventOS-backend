import { IsOptional, IsString } from "class-validator";

export class EntranceQrDto {

  @IsString()
  festivalId!:string;

  @IsString()
  code!:string;

  @IsOptional()
  @IsString()
  gate?:string;

  @IsOptional()
  @IsString()
  device?:string;

}


export class EntranceNfcDto {

  @IsString()
  festivalId!:string;

  @IsString()
  uid!:string;

  @IsOptional()
  @IsString()
  gate?:string;

  @IsOptional()
  @IsString()
  device?:string;

}


export class EntranceManualDto {

  @IsString()
  festivalId!:string;

  @IsString()
  query!:string;

  @IsOptional()
  @IsString()
  gate?:string;

  @IsOptional()
  @IsString()
  device?:string;

}