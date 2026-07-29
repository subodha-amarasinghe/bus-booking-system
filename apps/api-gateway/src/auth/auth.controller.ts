import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientProxy) {}

  @Post('login')
  login(@Body(new ZodValidationPipe(LoginRequestSchema)) dto: LoginRequest) {
    return firstValueFrom(this.client.send(AUTH_LOGIN, dto));
  }

  @Post('register')
  register(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) dto: RegisterRequest,
  ) {
    return firstValueFrom(this.client.send(AUTH_REGISTER, dto));
  }

  @Post('refresh')
  refresh(
    @Body(new ZodValidationPipe(RefreshRequestSchema)) dto: RefreshRequest,
  ) {
    return firstValueFrom(this.client.send(AUTH_REFRESH, dto));
  }

  @Post('validate')
  validate(
    @Body(new ZodValidationPipe(ValidateTokenRequestSchema))
    dto: ValidateTokenRequest,
  ) {
    return firstValueFrom(this.client.send(AUTH_VALIDATE_TOKEN, dto));
  }
}
