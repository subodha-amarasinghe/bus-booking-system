import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateProfileRequestSchema,
  GetProfileRequestSchema,
  ManageCustomersRequestSchema,
  ManageInternalRequestSchema,
  UserRole,
  type CreateProfileRequest,
  type GetProfileRequest,
  type ManageCustomersRequest,
  type ManageInternalRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  USER_CREATE_PROFILE,
  USER_GET_PROFILE,
  USER_MANAGE_CUSTOMERS,
  USER_MANAGE_INTERNAL,
} from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) {}

  @Post('profile')
  createProfile(
    @Body(new ZodValidationPipe(CreateProfileRequestSchema))
    dto: CreateProfileRequest,
  ) {
    return firstValueFrom(this.client.send(USER_CREATE_PROFILE, dto));
  }

  @Post('profile/get')
  getProfile(
    @Body(new ZodValidationPipe(GetProfileRequestSchema))
    dto: GetProfileRequest,
  ) {
    return firstValueFrom(this.client.send(USER_GET_PROFILE, dto));
  }

  @Post('manage/internal')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_STAFF)
  manageInternal(
    @Body(new ZodValidationPipe(ManageInternalRequestSchema))
    dto: ManageInternalRequest,
  ) {
    return firstValueFrom(this.client.send(USER_MANAGE_INTERNAL, dto));
  }

  @Post('manage/customers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_STAFF, UserRole.CUSTOMER_STAFF)
  manageCustomers(
    @Body(new ZodValidationPipe(ManageCustomersRequestSchema))
    dto: ManageCustomersRequest,
  ) {
    return firstValueFrom(this.client.send(USER_MANAGE_CUSTOMERS, dto));
  }
}
