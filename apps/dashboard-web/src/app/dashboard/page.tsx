import Link from 'next/link';
import {
  ArrowRight,
  Bus,
  CalendarClock,
  MapPin,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';
import type { Bus as BusType, Location, Route, Trip } from '@bus-booking/shared-types';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { getStaffProfile, getStaffSession } from '../../lib/auth';
import { NAV_ITEMS } from '../../lib/nav';
import { ROLE_LABELS } from '../../lib/roles';
import { serverPost } from '../../lib/server-api';

export const dynamic = 'force-dynamic';

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  icon: LucideIcon;
}) {
  return (
    <div className="ui-card flex items-center gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <span className="block text-2xl font-semibold text-slate-900">
          {value ?? '—'}
        </span>
        <span className="block text-sm text-slate-500">{label}</span>
      </span>
    </div>
  );
}

export default async function DashboardOverviewPage() {
  const [session, profile] = await Promise.all([
    getStaffSession(),
    getStaffProfile(),
  ]);

  const [buses, routes, locations, trips] = await Promise.all([
    serverPost<BusType[]>('/buses/list'),
    serverPost<Route[]>('/routes/list'),
    serverPost<Location[]>('/routes/locations/list'),
    serverPost<Trip[]>('/trips/search'),
  ]);

  const firstName = profile?.name?.split(' ')[0];
  const modules = NAV_ITEMS.filter((item) => item.href !== '/dashboard');

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description="Here's the current state of the network and everything you can manage."
        actions={
          session ? <StatusBadge status={session.role} label={ROLE_LABELS[session.role]} /> : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Buses in the fleet" value={buses?.length ?? null} icon={Bus} />
        <StatCard label="Routes published" value={routes?.length ?? null} icon={Waypoints} />
        <StatCard label="Stops on the map" value={locations?.length ?? null} icon={MapPin} />
        <StatCard
          label="Trips scheduled"
          value={trips?.length ?? null}
          icon={CalendarClock}
        />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-900">
        What would you like to do?
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="ui-card group transition hover:border-brand-200 hover:shadow-md"
            >
              <span className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-brand-50 group-hover:text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    {item.label}
                    <ArrowRight
                      className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {item.description}
                  </span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {buses === null && routes === null && trips === null ? (
        <p className="ui-alert-error mt-6">
          We couldn&apos;t reach the API gateway, so the counts above are
          unavailable. The sections themselves will still load once it is back.
        </p>
      ) : null}
    </>
  );
}
