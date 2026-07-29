import { getPassengerSession } from '../../../lib/auth';
import { LogoutButton } from '../../../features/my-bookings/logout-button';

export default async function ProfilePage() {
  const session = await getPassengerSession();
  return (
    <main>
      <section className="card auth-card stack">
        <h1>Profile</h1>
        <span>User ID: {session?.userId}</span>
        {session?.phone && <span>Phone: {session.phone}</span>}
        <LogoutButton />
      </section>
    </main>
  );
}
