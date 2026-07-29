export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <div className="card">
        <h1>Bus Booking Dashboard</h1>
        <p>Staff tools for users, buses, seats, routes, trips, and refunds.</p>
        <p>
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
