import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UserProfile, UserRole } from '../generated/prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({ where: { id } });
  }

  findByPhone(phone: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({ where: { phone } });
  }

  create(data: {
    phone: string;
    name: string;
    email?: string;
    role?: UserRole;
  }): Promise<UserProfile> {
    return this.prisma.userProfile.create({ data });
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      phone: string;
      email: string;
      role: UserRole;
      isActive: boolean;
    }>,
  ): Promise<UserProfile> {
    return this.prisma.userProfile.update({ where: { id }, data });
  }
}
