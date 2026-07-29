import Link from 'next/link';
import { QueryProvider } from '../providers/query-provider';
import './global.css';

export const metadata = {
  title: 'Bus Booking',
  description: 'Search trips, reserve seats, and manage bookings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">Bus Booking</Link>
          <nav aria-label="Main navigation">
            <Link href="/search">Trips</Link>
            <Link href="/bookings">My bookings</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </header>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
