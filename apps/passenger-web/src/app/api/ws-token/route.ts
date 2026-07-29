import { proxyJson } from '../../../lib/route-proxy';

export async function POST() {
  // The browser receives only this short-lived websocket credential.
  // The access JWT remains inside this Route Handler.
  return proxyJson('/auth/ws-token', { method: 'POST' });
}
