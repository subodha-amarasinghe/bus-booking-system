import { createPassengerApi } from '@bus-booking/passenger-core';
import { GATEWAY_URL } from './gateway';
import { getAccessToken } from './secure-token';

/**
 * The web build points this at its own `/api` BFF so the JWT can stay in an
 * HttpOnly cookie. On device there is no BFF to hide behind, so we call the
 * gateway directly and attach the SecureStore token per request.
 */
export const passengerApi = createPassengerApi({
  baseUrl: GATEWAY_URL,
  fetch: (url, init) =>
    fetch(url, {
      method: init.method,
      headers: init.headers,
      body: init.body,
    }),
  getAccessToken,
  paths: {
    seatMap: (tripId) => `/trips/${encodeURIComponent(tripId)}/seats`,
    releaseSeats: '/bookings/release-seat',
  },
});
