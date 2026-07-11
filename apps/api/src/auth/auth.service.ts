import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException("Email atau password salah");
    }
    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    };
  }
}
