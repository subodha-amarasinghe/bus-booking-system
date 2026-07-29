import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateLocationRequestSchema,
  CreateRouteRequestSchema,
  GetOsmPathRequestSchema,
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
import { RouteService } from './route.service';

@Controller()
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @MessagePattern(ROUTE_CREATE_LOCATION)
  createLocation(
    @Payload(new ZodValidationPipe(CreateLocationRequestSchema))
    dto: CreateLocationRequest,
  ) {
    return this.routeService.createLocation(dto);
  }

  @MessagePattern(ROUTE_CREATE_ROUTE)
  createRoute(
    @Payload(new ZodValidationPipe(CreateRouteRequestSchema))
    dto: CreateRouteRequest,
  ) {
    return this.routeService.createRoute(dto);
  }

  @MessagePattern(ROUTE_GET_OSM_PATH)
  getOsmPath(
    @Payload(new ZodValidationPipe(GetOsmPathRequestSchema))
    dto: GetOsmPathRequest,
  ) {
    return this.routeService.getOsmPath(dto);
  }
}
