import { createPassengerApi } from '@bus-booking/passenger-core';

export const passengerApi = createPassengerApi({
  baseUrl: '/api',
  fetch: (url, init) => fetch(url, init),
  paths: {
    seatMap: (tripId) => `/trips/${encodeURIComponent(tripId)}/seats`,
    releaseSeats: '/bookings/release-seat',
  },
});
