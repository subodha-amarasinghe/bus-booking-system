import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateProfileRequestSchema,
  GetProfileRequestSchema,
  ManageCustomersRequestSchema,
  ManageInternalRequestSchema,
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
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(USER_CREATE_PROFILE)
  createProfile(
    @Payload(new ZodValidationPipe(CreateProfileRequestSchema))
    dto: CreateProfileRequest,
  ) {
    return this.userService.createProfile(dto);
  }

  @MessagePattern(USER_GET_PROFILE)
  getProfile(
    @Payload(new ZodValidationPipe(GetProfileRequestSchema))
    dto: GetProfileRequest,
  ) {
    return this.userService.getProfile(dto);
  }

  @MessagePattern(USER_MANAGE_INTERNAL)
  manageInternal(
    @Payload(new ZodValidationPipe(ManageInternalRequestSchema))
    dto: ManageInternalRequest,
  ) {
    return this.userService.manageInternal(dto);
  }

  @MessagePattern(USER_MANAGE_CUSTOMERS)
  manageCustomers(
    @Payload(new ZodValidationPipe(ManageCustomersRequestSchema))
    dto: ManageCustomersRequest,
  ) {
    return this.userService.manageCustomers(dto);
  }
}
