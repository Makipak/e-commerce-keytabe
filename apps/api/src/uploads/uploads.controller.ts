import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname, join } from "path";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

/**
 * Upload gambar produk ke disk lokal (folder uploads/ di root apps/api).
 * File di-serve statis di GET /uploads/* (lihat main.ts).
 * Di VPS nanti: folder ini tinggal di-mount ke volume + backup rutin.
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");

const ALLOWED = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

@Controller("admin/uploads")
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          // Sanitasi: nama file dari SKU convention tetap terbaca,
          // ditambah timestamp agar unik & tidak menimpa
          const ext = extname(file.originalname).toLowerCase();
          const base = file.originalname
            .replace(ext, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 80);
          cb(null, `${base}_${Date.now()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(null, ALLOWED.includes(ext));
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        `File tidak valid. Format: ${ALLOWED.join(", ")}, maks 5MB`,
      );
    }
    const publicUrl = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
    return { url: `${publicUrl}/uploads/${file.filename}`, filename: file.filename };
  }
}
