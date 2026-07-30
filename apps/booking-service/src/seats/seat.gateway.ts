import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  SEAT_SOCKET_BOOKED,
  SEAT_SOCKET_JOIN_TRIP,
  SEAT_SOCKET_LOCKED,
  SEAT_SOCKET_RELEASED,
} from '@bus-booking/shared-events';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(Number(process.env.WS_PORT ?? 3020), {
  cors: true,
  namespace: '/seats',
})
export class SeatGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(SEAT_SOCKET_JOIN_TRIP)
  handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ): void {
    const room = `trip:${data.tripId}`;
    void client.join(room);
  }

  emitSeatLocked(tripId: string, seatNo: number, lockToken: string): void {
    this.server.to(`trip:${tripId}`).emit(SEAT_SOCKET_LOCKED, {
      tripId,
      seatNo,
      lockToken,
    });
  }

  emitSeatReleased(tripId: string, seatNo: number): void {
    this.server.to(`trip:${tripId}`).emit(SEAT_SOCKET_RELEASED, { tripId, seatNo });
  }

  emitSeatBooked(tripId: string, seatNo: number, bookingId: string): void {
    this.server.to(`trip:${tripId}`).emit(SEAT_SOCKET_BOOKED, {
      tripId,
      seatNo,
      bookingId,
    });
  }
}
