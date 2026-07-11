import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsInt, IsString, Min } from "class-validator";
import { ShippingService } from "./shipping.service";

class CostDto {
  @IsInt()
  districtId: number;

  @IsInt()
  @Min(1)
  weightGram: number;

  @IsString()
  courier: string;
}

@Controller("shipping")
export class ShippingController {
  constructor(private shipping: ShippingService) {}

  @Get("provinces")
  provinces() {
    return this.shipping.getProvinces();
  }

  @Get("cities/:provinceId")
  cities(@Param("provinceId") provinceId: string) {
    return this.shipping.getCities(Number(provinceId));
  }

  @Get("districts/:cityId")
  districts(@Param("cityId") cityId: string) {
    return this.shipping.getDistricts(Number(cityId));
  }

  @Post("cost")
  cost(@Body() dto: CostDto) {
    return this.shipping.calculateCost(dto);
  }
}
