import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConvertDto {
  @IsNumber()
  @Min(0)
  amount_cny: number;

  @IsOptional()
  @IsString()
  to?: string;
}

