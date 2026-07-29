import type { Metadata } from 'next';
import { ClientProviders } from '../providers/client-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bus Booking Dashboard',
  description: 'Staff dashboard for the bus booking system',
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
