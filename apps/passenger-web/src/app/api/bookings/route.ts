import { proxyJson } from '../../../lib/route-proxy';

export async function GET() {
  return proxyJson('/bookings/me');
}
