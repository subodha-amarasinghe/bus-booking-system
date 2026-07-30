import {
  Armchair,
  Bus,
  CalendarClock,
  LayoutDashboard,
  Ticket,
  Users,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Everything you can manage, at a glance.',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/buses',
    label: 'Buses',
    description: 'Register buses and review the fleet.',
    icon: Bus,
  },
  {
    href: '/dashboard/seats',
    label: 'Seat Mapping',
    description: 'Draw the seat layout for each bus.',
    icon: Armchair,
  },
  {
    href: '/dashboard/routes',
    label: 'Routes',
    description: 'Manage stops and the routes between them.',
    icon: Waypoints,
  },
  {
    href: '/dashboard/trips',
    label: 'Trips',
    description: 'Schedule departures and set fares.',
    icon: CalendarClock,
  },
  {
    href: '/dashboard/users',
    label: 'Users',
    description: 'Look up passengers and manage staff accounts.',
    icon: Users,
  },
  {
    href: '/dashboard/cancellations',
    label: 'Cancellations',
    description: 'Cancel bookings, quote refunds, log payments.',
    icon: Ticket,
  },
];
