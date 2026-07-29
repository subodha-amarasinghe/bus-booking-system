'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const QueryProvider = dynamic(
  () => import('./query-provider').then((m) => ({ default: m.QueryProvider })),
  { ssr: false },
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
