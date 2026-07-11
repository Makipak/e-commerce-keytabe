import { Module, forwardRef } from "@nestjs/common";
import { OrdersController, AdminOrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { PaymentsModule } from "../payments/payments.module";
import { ShippingModule } from "../shipping/shipping.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [forwardRef(() => PaymentsModule), ShippingModule, NotificationsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
