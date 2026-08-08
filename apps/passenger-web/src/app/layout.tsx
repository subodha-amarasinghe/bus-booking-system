import { Bus, Search, Ticket, UserRound } from 'lucide-react';
import Link from 'next/link';
import { QueryProvider } from '../providers/query-provider';
import { ThemeProvider } from '../providers/theme-provider';
import { LoginLink } from '../features/auth/login-link';
import { ThemeToggle } from '../features/theme/theme-toggle';
import { hasPassengerCookie } from '../lib/auth';
import { THEME_BOOT_SCRIPT } from '../lib/theme';
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:shadow-soft dark:focus:bg-slate-900"
          href="#content"
        >
          Skip to content
        </a>

        <ThemeProvider>
          <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
              <Link
                className="flex items-center gap-2.5 rounded-xl py-2 pr-2 text-slate-900 dark:text-slate-100"
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
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:px-3"
                        href={item.href}
                      >
                        <item.icon
                          aria-hidden="true"
                          className="h-[18px] w-[18px]"
                        />
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sr-only sm:hidden">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="ml-1">
                    <ThemeToggle />
                  </li>
                  {!signedIn && (
                    <li>
                      <LoginLink className="ui-btn-primary ml-1 min-h-[44px]" />
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

          <footer className="mt-8 border-t border-slate-200 py-8 dark:border-slate-800">
            <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Bus Booking
                </span>
                <span>
                  Live seat availability, secure payments, and instant
                  confirmations.
                </span>
              </div>
              <Link
                className="font-medium text-slate-600 underline-offset-2 hover:text-brand-700 hover:underline dark:text-slate-300 dark:hover:text-brand-300"
                href="/cancellation-policy"
              >
                Cancellation policy
              </Link>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
