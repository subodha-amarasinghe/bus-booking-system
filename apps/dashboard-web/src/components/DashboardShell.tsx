'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Bus, LogOut, Menu, X } from 'lucide-react';
import { NAV_ITEMS } from '../lib/nav';
import { ROLE_LABELS, type StaffSession } from '../lib/roles';
import { StaffSessionProvider } from '../providers/staff-session-provider';
import { Spinner } from './LoadingBlock';

function isActivePath(pathname: string, href: string): boolean {
  return href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href);
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function DashboardShell({
  session,
  children,
}: {
  session: StaffSession;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSigningOut, setSigningOut] = useState(false);

  // Navigating on mobile should dismiss the drawer.
  useEffect(() => setSidebarOpen(false), [pathname]);

  const displayName = session.name ?? 'Staff member';
  const activeItem = NAV_ITEMS.find((item) => isActivePath(pathname, item.href));

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  const nav = (
    <nav className="flex-1 space-y-1 px-3" aria-label="Dashboard sections">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              active
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Icon
              className={clsx(
                'h-4 w-4 shrink-0',
                active ? 'text-brand-600' : 'text-slate-400',
              )}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Bus className="h-5 w-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-slate-900">
          Bus Booking
        </span>
        <span className="block text-xs text-slate-500">Staff dashboard</span>
      </span>
    </div>
  );

  const userCard = (
    <div className="border-t border-slate-200 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {initials(displayName) || 'ST'}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-medium text-slate-900">
            {displayName}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {ROLE_LABELS[session.role]}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={signOut}
        disabled={isSigningOut}
        className="ui-btn-ghost mt-2 w-full justify-start text-slate-600"
      >
        {isSigningOut ? (
          <Spinner />
        ) : (
          <LogOut className="h-4 w-4" aria-hidden />
        )}
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );

  return (
    <StaffSessionProvider session={session}>
      <div className="min-h-screen lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          {brand}
          {nav}
          {userCard}
        </aside>

        {/* Mobile drawer */}
        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/40"
            />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between pr-3">
                {brand}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="ui-btn-ghost px-2 py-2"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              {nav}
              {userCard}
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="ui-btn-ghost px-2 py-2 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <span className="text-sm font-semibold text-slate-800">
              {activeItem?.label ?? 'Dashboard'}
            </span>
            <span className="ml-auto hidden text-xs text-slate-500 sm:block">
              Signed in as {displayName} · {ROLE_LABELS[session.role]}
            </span>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </StaffSessionProvider>
  );
}
