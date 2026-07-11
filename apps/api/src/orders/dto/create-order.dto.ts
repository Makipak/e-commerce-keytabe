import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CartItemDto {
  @IsString()
  variantId: string;

  @IsInt()
  @Min(1)
  qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsString()
  @MinLength(2)
  guestName: string;

  @IsString()
  @MinLength(9)
  guestPhone: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsString()
  @MinLength(10)
  address: string;

  @IsInt()
  provinceId: number;

  @IsInt()
  cityId: number;

  @IsInt()
  districtId: number;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  courier: string;

  @IsString()
  courierService: string;
}
