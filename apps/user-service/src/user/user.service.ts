import { Injectable } from '@nestjs/common';
import type {
  CreateProfileRequest,
  GetProfileRequest,
  ManageCustomersRequest,
  ManageInternalRequest,
} from '@bus-booking/shared-types';
import { DomainException } from '../common/exceptions/domain.exception';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async createProfile(dto: CreateProfileRequest) {
    const existing = await this.repo.findByPhone(dto.phone);
    if (existing) {
      throw new DomainException('Profile already exists', 409, 'USER_EXISTS');
    }
    return this.repo.create({
      phone: dto.phone,
      name: dto.name,
      email: dto.email,
      role: dto.role ?? 'PASSENGER',
    });
  }

  async getProfile(dto: GetProfileRequest) {
    const profile = await this.repo.findById(dto.userId);
    if (!profile) {
      throw new DomainException('Profile not found', 404, 'USER_NOT_FOUND');
    }
    return profile;
  }

  async manageInternal(dto: ManageInternalRequest) {
    const profile = await this.repo.findById(dto.userId);
    if (!profile) {
      throw new DomainException('Profile not found', 404, 'USER_NOT_FOUND');
    }
    return this.repo.update(dto.userId, {
      role: dto.role,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      isActive: dto.isActive,
    });
  }

  async manageCustomers(dto: ManageCustomersRequest) {
    const profile = await this.repo.findById(dto.userId);
    if (!profile) {
      throw new DomainException('Profile not found', 404, 'USER_NOT_FOUND');
    }
    if (profile.role !== 'PASSENGER') {
      throw new DomainException('Not a customer profile', 400, 'USER_NOT_CUSTOMER');
    }
    return this.repo.update(dto.userId, {
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      isActive: dto.isActive,
    });
  }
}
