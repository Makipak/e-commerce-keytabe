import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { UPLOAD_DIR } from "./uploads/uploads.controller";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? "http://localhost:3000",
      process.env.ADMIN_URL ?? "http://localhost:5173",
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  // Serve gambar produk yang di-upload admin
  app.useStaticAssets(UPLOAD_DIR, {
    prefix: "/uploads/",
    maxAge: "7d",
    immutable: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
