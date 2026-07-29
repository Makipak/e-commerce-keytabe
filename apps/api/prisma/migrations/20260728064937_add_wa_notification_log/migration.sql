-- CreateTable
CREATE TABLE "WaNotificationLog" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaNotificationLog_orderNumber_idx" ON "WaNotificationLog"("orderNumber");

-- AddForeignKey
ALTER TABLE "WaNotificationLog" ADD CONSTRAINT "WaNotificationLog_orderNumber_fkey" FOREIGN KEY ("orderNumber") REFERENCES "Order"("orderNumber") ON DELETE CASCADE ON UPDATE CASCADE;
