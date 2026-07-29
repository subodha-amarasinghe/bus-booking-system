import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  LoginRequestSchema,
  RefreshRequestSchema,
  RegisterRequestSchema,
  ValidateTokenRequestSchema,
  type LoginRequest,
  type RefreshRequest,
  type RegisterRequest,
  type ValidateTokenRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  AUTH_LOGIN,
  AUTH_REFRESH,
  AUTH_REGISTER,
  AUTH_VALIDATE_TOKEN,
} from '@bus-booking/shared-events';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_LOGIN)
  login(@Payload(new ZodValidationPipe(LoginRequestSchema)) dto: LoginRequest) {
    return this.authService.login(dto);
  }

  @MessagePattern(AUTH_REGISTER)
  register(
    @Payload(new ZodValidationPipe(RegisterRequestSchema))
    dto: RegisterRequest,
  ) {
    return this.authService.register(dto);
  }

  @MessagePattern(AUTH_REFRESH)
  refresh(
    @Payload(new ZodValidationPipe(RefreshRequestSchema)) dto: RefreshRequest,
  ) {
    return this.authService.refresh(dto);
  }

  @MessagePattern(AUTH_VALIDATE_TOKEN)
  validateToken(
    @Payload(new ZodValidationPipe(ValidateTokenRequestSchema))
    dto: ValidateTokenRequest,
  ) {
    return this.authService.validateToken(dto);
  }
}
