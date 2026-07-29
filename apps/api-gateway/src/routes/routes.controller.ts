import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateLocationRequestSchema,
  CreateRouteRequestSchema,
  GetOsmPathRequestSchema,
  UserRole,
  type CreateLocationRequest,
  type CreateRouteRequest,
  type GetOsmPathRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  ROUTE_CREATE_LOCATION,
  ROUTE_CREATE_ROUTE,
  ROUTE_GET_OSM_PATH,
} from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('routes')
export class RoutesController {
  constructor(
    @Inject('ROUTE_MAPS_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Post('locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_STAFF)
  createLocation(
    @Body(new ZodValidationPipe(CreateLocationRequestSchema))
    dto: CreateLocationRequest,
  ) {
    return firstValueFrom(this.client.send(ROUTE_CREATE_LOCATION, dto));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_STAFF)
  createRoute(
    @Body(new ZodValidationPipe(CreateRouteRequestSchema))
    dto: CreateRouteRequest,
  ) {
    return firstValueFrom(this.client.send(ROUTE_CREATE_ROUTE, dto));
  }

  @Post('osm-path')
  getOsmPath(
    @Body(new ZodValidationPipe(GetOsmPathRequestSchema))
    dto: GetOsmPathRequest,
  ) {
    return firstValueFrom(this.client.send(ROUTE_GET_OSM_PATH, dto));
  }
}
