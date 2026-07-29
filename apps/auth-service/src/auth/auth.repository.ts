import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UserCredential, UserRole } from '../generated/prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phone: string): Promise<UserCredential | null> {
    return this.prisma.userCredential.findUnique({ where: { phone } });
  }

  findById(id: string): Promise<UserCredential | null> {
    return this.prisma.userCredential.findUnique({ where: { id } });
  }

  findByRefreshToken(refreshToken: string): Promise<UserCredential | null> {
    return this.prisma.userCredential.findFirst({ where: { refreshToken } });
  }

  create(data: {
    phone: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<UserCredential> {
    return this.prisma.userCredential.create({ data });
  }

  updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<UserCredential> {
    return this.prisma.userCredential.update({
      where: { id },
      data: { refreshToken },
    });
  }
}
