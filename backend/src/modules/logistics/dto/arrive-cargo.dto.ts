import { IsNumber, IsOptional, Min } from 'class-validator';

export class ArriveCargoDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;
}

