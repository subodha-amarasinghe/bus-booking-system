import type { Metadata } from 'next';
import { ClientProviders } from '../providers/client-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Staff Dashboard · Bus Booking',
  description:
    'Manage buses, seat maps, routes, trips, users, cancellations and refunds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
