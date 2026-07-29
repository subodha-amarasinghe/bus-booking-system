import { proxyJson } from '../../../../../lib/route-proxy';

export async function GET(
  _request: Request,
  { params }: { params: { tripId: string } },
) {
  return proxyJson(`/trips/${encodeURIComponent(params.tripId)}/seats`);
}
