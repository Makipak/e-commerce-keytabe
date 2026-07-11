import { Module } from "@nestjs/common";
import { FonnteService } from "./fonnte.service";

@Module({
  providers: [FonnteService],
  exports: [FonnteService],
})
export class NotificationsModule {}
