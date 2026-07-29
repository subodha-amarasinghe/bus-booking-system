/**
 * Shared fixtures for every service seed script.
 *
 * Each service owns its own database, so cross-service references (a booking's
 * userId, a trip's routeId, …) only line up if both sides seed the same literal
 * UUIDs. Keep these ids stable — changing one silently orphans rows elsewhere.
 */
import { scryptSync } from 'crypto';

export const SEED_PASSWORD = 'Password123!';

/** Mirrors AuthService.hashPassword, with a fixed salt so re-seeding is stable. */
export function hashPassword(password: string, salt = 'bus0booking0seed0salt00000000000'): string {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function at(daysFromNow: number, hour: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

export type SeedRole = 'PASSENGER' | 'ADMIN_STAFF' | 'CUSTOMER_STAFF';

export interface SeedUser {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: SeedRole;
}

export const users: SeedUser[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    phone: '0770000001',
    name: 'Admin Staff',
    email: 'admin@busbooking.test',
    role: 'ADMIN_STAFF',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    phone: '0770000002',
    name: 'Customer Support',
    email: 'support@busbooking.test',
    role: 'CUSTOMER_STAFF',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    phone: '0771111111',
    name: 'Nimal Perera',
    email: 'nimal@example.test',
    role: 'PASSENGER',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    phone: '0772222222',
    name: 'Kamala Silva',
    email: 'kamala@example.test',
    role: 'PASSENGER',
  },
];

export const locations = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Colombo Fort',
    code: 'CMB',
    latitude: 6.9344,
    longitude: 79.8428,
    city: 'Colombo',
    district: 'Colombo',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Kandy Central',
    code: 'KDY',
    latitude: 7.2906,
    longitude: 80.6337,
    city: 'Kandy',
    district: 'Kandy',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    name: 'Galle Bus Stand',
    code: 'GAL',
    latitude: 6.0535,
    longitude: 80.221,
    city: 'Galle',
    district: 'Galle',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    name: 'Jaffna Central',
    code: 'JAF',
    latitude: 9.6615,
    longitude: 80.0255,
    city: 'Jaffna',
    district: 'Jaffna',
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    name: 'Matara Town',
    code: 'MAT',
    latitude: 5.9485,
    longitude: 80.5353,
    city: 'Matara',
    district: 'Matara',
  },
];

export const routes = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'Colombo → Kandy',
    originLocationId: locations[0].id,
    destinationLocationId: locations[1].id,
    distanceKm: 115,
    estimatedDurationMin: 195,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    name: 'Colombo → Galle',
    originLocationId: locations[0].id,
    destinationLocationId: locations[2].id,
    distanceKm: 126,
    estimatedDurationMin: 150,
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    name: 'Colombo → Jaffna',
    originLocationId: locations[0].id,
    destinationLocationId: locations[3].id,
    distanceKm: 396,
    estimatedDurationMin: 480,
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    name: 'Galle → Matara',
    originLocationId: locations[2].id,
    destinationLocationId: locations[4].id,
    distanceKm: 45,
    estimatedDurationMin: 70,
  },
];

export const buses = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    plateNumber: 'NA-1234',
    name: 'Express Liner 1',
    capacity: 40,
    operatorId: 'operator-lanka-express',
    rows: 10,
    columns: 4,
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    plateNumber: 'NB-5678',
    name: 'Highway Cruiser',
    capacity: 32,
    operatorId: 'operator-lanka-express',
    rows: 8,
    columns: 4,
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    plateNumber: 'NC-9012',
    name: 'Night Rider',
    capacity: 44,
    operatorId: 'operator-southern-lines',
    rows: 11,
    columns: 4,
  },
];

export interface SeedSeat {
  seatNo: string;
  row: number;
  column: number;
  type: 'STANDARD' | 'WINDOW' | 'AISLE' | 'DISABLED';
  isAvailable: boolean;
}

/** Standard 2+2 coach: outer columns are windows, inner columns are aisles. */
export function buildSeats(rows: number, columns: number): SeedSeat[] {
  const seats: SeedSeat[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const isWindow = column === 0 || column === columns - 1;
      seats.push({
        seatNo: `${row + 1}${String.fromCharCode(65 + column)}`,
        row,
        column,
        type: isWindow ? 'WINDOW' : 'AISLE',
        isAvailable: true,
      });
    }
  }
  return seats;
}

export const seatLayouts = buses.map((bus, index) => ({
  id: `40000000-0000-4000-8000-00000000000${index + 1}`,
  busId: bus.id,
  rows: bus.rows,
  columns: bus.columns,
  seats: buildSeats(bus.rows, bus.columns),
}));

export const trips = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    busId: buses[0].id,
    routeId: routes[0].id,
    departureAt: at(1, 6),
    arrivalAt: at(1, 9),
    fareAmount: 1500,
    currency: 'LKR',
    availableSeats: 40,
    status: 'SCHEDULED',
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    busId: buses[1].id,
    routeId: routes[1].id,
    departureAt: at(1, 8),
    arrivalAt: at(1, 11),
    fareAmount: 1200,
    currency: 'LKR',
    availableSeats: 32,
    status: 'SCHEDULED',
  },
  {
    id: '50000000-0000-4000-8000-000000000003',
    busId: buses[2].id,
    routeId: routes[2].id,
    departureAt: at(2, 21),
    arrivalAt: at(3, 5),
    fareAmount: 3500,
    currency: 'LKR',
    availableSeats: 44,
    status: 'SCHEDULED',
  },
  {
    id: '50000000-0000-4000-8000-000000000004',
    busId: buses[0].id,
    routeId: routes[3].id,
    departureAt: at(3, 15),
    arrivalAt: at(3, 17),
    fareAmount: 600,
    currency: 'LKR',
    availableSeats: 40,
    status: 'SCHEDULED',
  },
];

export const bookings = [
  {
    id: '60000000-0000-4000-8000-000000000001',
    tripId: trips[0].id,
    userId: users[2].id,
    seatNo: '1A',
    status: 'CONFIRMED',
    passengerName: users[2].name,
    passengerPhone: users[2].phone,
    fareAmount: trips[0].fareAmount,
    currency: 'LKR',
    idempotencyKey: 'seed-booking-0001',
    confirmedAt: new Date(),
  },
  {
    id: '60000000-0000-4000-8000-000000000002',
    tripId: trips[0].id,
    userId: users[3].id,
    seatNo: '1B',
    status: 'CONFIRMED',
    passengerName: users[3].name,
    passengerPhone: users[3].phone,
    fareAmount: trips[0].fareAmount,
    currency: 'LKR',
    idempotencyKey: 'seed-booking-0002',
    confirmedAt: new Date(),
  },
  {
    id: '60000000-0000-4000-8000-000000000003',
    tripId: trips[1].id,
    userId: users[2].id,
    seatNo: '3C',
    status: 'CONFIRMED',
    passengerName: users[2].name,
    passengerPhone: users[2].phone,
    fareAmount: trips[1].fareAmount,
    currency: 'LKR',
    idempotencyKey: 'seed-booking-0003',
    confirmedAt: new Date(),
  },
  {
    id: '60000000-0000-4000-8000-000000000004',
    tripId: trips[2].id,
    userId: users[3].id,
    seatNo: '5D',
    status: 'CANCELLED',
    passengerName: users[3].name,
    passengerPhone: users[3].phone,
    fareAmount: trips[2].fareAmount,
    currency: 'LKR',
    idempotencyKey: 'seed-booking-0004',
    confirmedAt: new Date(),
  },
];

export const payments = [
  {
    id: '70000000-0000-4000-8000-000000000001',
    bookingId: bookings[0].id,
    userId: bookings[0].userId,
    amount: bookings[0].fareAmount,
    currency: 'LKR',
    status: 'SUCCEEDED',
    method: 'CARD',
    providerRef: 'seed_pay_0001',
    paidAt: new Date(),
  },
  {
    id: '70000000-0000-4000-8000-000000000002',
    bookingId: bookings[1].id,
    userId: bookings[1].userId,
    amount: bookings[1].fareAmount,
    currency: 'LKR',
    status: 'SUCCEEDED',
    method: 'ONLINE',
    providerRef: 'seed_pay_0002',
    paidAt: new Date(),
  },
  {
    id: '70000000-0000-4000-8000-000000000003',
    bookingId: bookings[2].id,
    userId: bookings[2].userId,
    amount: bookings[2].fareAmount,
    currency: 'LKR',
    status: 'PENDING',
    method: 'ONLINE',
    providerRef: null,
    paidAt: null,
  },
  {
    id: '70000000-0000-4000-8000-000000000004',
    bookingId: bookings[3].id,
    userId: bookings[3].userId,
    amount: bookings[3].fareAmount,
    currency: 'LKR',
    status: 'REFUNDED',
    method: 'CARD',
    providerRef: 'seed_pay_0004',
    paidAt: new Date(),
  },
];

export const cancellations = [
  {
    id: '80000000-0000-4000-8000-000000000001',
    bookingId: bookings[3].id,
    userId: bookings[3].userId,
    reason: 'Passenger changed travel date',
    status: 'APPROVED',
  },
];

export const refunds = [
  {
    id: '90000000-0000-4000-8000-000000000001',
    bookingId: bookings[3].id,
    paymentId: payments[3].id,
    userId: bookings[3].userId,
    cancellationId: cancellations[0].id,
    amount: bookings[3].fareAmount,
    currency: 'LKR',
    status: 'COMPLETED',
    reason: 'Cancelled more than 24h before departure',
    processedAt: new Date(),
  },
];

export const notificationLogs = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    event: 'user.created',
    payload: { userId: users[2].id, phone: users[2].phone, name: users[2].name },
    channel: 'LOG',
    status: 'SENT',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    event: 'booking.confirmed',
    payload: { bookingId: bookings[0].id, tripId: bookings[0].tripId, seatNo: bookings[0].seatNo },
    channel: 'EMAIL',
    status: 'SENT',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    event: 'payment.succeeded',
    payload: { paymentId: payments[0].id, bookingId: payments[0].bookingId, amount: payments[0].amount },
    channel: 'SMS',
    status: 'SENT',
  },
];
