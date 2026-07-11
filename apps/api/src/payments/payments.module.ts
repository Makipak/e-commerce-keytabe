import { Module, forwardRef } from "@nestjs/common";
import { XenditService } from "./xendit.service";
import { XenditWebhookController } from "./xendit-webhook.controller";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [forwardRef(() => OrdersModule)],
  controllers: [XenditWebhookController],
  providers: [XenditService],
  exports: [XenditService],
})
export class PaymentsModule {}
