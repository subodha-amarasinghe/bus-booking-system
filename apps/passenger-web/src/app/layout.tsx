import { Bus, LogIn, Search, Ticket, UserRound } from 'lucide-react';
import Link from 'next/link';
import { QueryProvider } from '../providers/query-provider';
import { hasPassengerCookie } from '../lib/auth';
import './global.css';

export const metadata = {
  title: 'Bus Booking · Reserve your seat',
  description: 'Search trips, pick live seats, and manage bookings on any device',
};

const NAV_ITEMS = [
  { href: '/search', label: 'Search trips', icon: Search },
  { href: '/bookings', label: 'My bookings', icon: Ticket },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const signedIn = hasPassengerCookie();

  return (
    <html lang="en">
      <body className="min-h-screen">
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:shadow-soft"
          href="#content"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
            <Link
              className="flex items-center gap-2.5 rounded-xl py-2 pr-2 text-slate-900"
              href="/"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
                <Bus aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-base font-bold tracking-tight">
                Bus Booking
              </span>
            </Link>

            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-0.5 sm:gap-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
                      href={item.href}
                    >
                      <item.icon aria-hidden="true" className="h-[18px] w-[18px]" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sr-only sm:hidden">{item.label}</span>
                    </Link>
                  </li>
                ))}
                {!signedIn && (
                  <li>
                    <Link
                      className="ui-btn-primary ml-1 min-h-[44px]"
                      href="/login"
                    >
                      <LogIn aria-hidden="true" className="h-[18px] w-[18px]" />
                      <span className="hidden sm:inline">Login</span>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </header>

        <QueryProvider>
          <main
            className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10"
            id="content"
          >
            {children}
          </main>
        </QueryProvider>

        <footer className="mt-8 border-t border-slate-200 py-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Bus Booking</span>
            <span>
              Live seat availability, secure payments, and instant confirmations.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
