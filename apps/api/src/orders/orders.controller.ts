import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { OrderStatus } from "@prisma/client";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

class UpdateStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  waybill?: string;
}

/** Publik: checkout & tracking (tanpa login) */
@Controller("orders")
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get("track/:orderNumber")
  track(@Param("orderNumber") orderNumber: string) {
    return this.orders.track(orderNumber);
  }
}

/** Admin (Refine) */
@Controller("admin/orders")
@UseGuards(JwtAuthGuard)
export class AdminOrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  list(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.orders.findAllAdmin({
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orders.findOneAdmin(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(id, dto.status, dto.waybill);
  }
}
