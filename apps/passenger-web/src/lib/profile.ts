import { UserSchema, type User } from '@bus-booking/shared-types';
import { getAccessToken } from './auth';
import { API_GATEWAY_URL } from './route-proxy';

export type PassengerProfile = Pick<User, 'id' | 'name' | 'phone' | 'email' | 'role'>;

const ProfileSchema = UserSchema.pick({
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
});

/** Enriches the JWT session with the profile record (name, phone, email). */
export async function getPassengerProfile(
  userId: string,
): Promise<PassengerProfile | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_GATEWAY_URL}/users/profile/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return ProfileSchema.safeParse(await response.json().catch(() => null)).data ?? null;
  } catch {
    return null;
  }
}
