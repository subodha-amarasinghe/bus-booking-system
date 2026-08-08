'use client';

import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { buildLoginHref } from '../../lib/format';

function LoginLinkInner({
  children,
  className,
  fallbackNext = '/',
}: {
  children?: ReactNode;
  className?: string;
  fallbackNext?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const here =
    pathname && pathname !== '/login' && pathname !== '/register'
      ? `${pathname}${search ? `?${search}` : ''}`
      : fallbackNext;

  return (
    <Link className={className} href={buildLoginHref(here)}>
      {children ?? (
        <>
          <LogIn aria-hidden="true" className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">Login</span>
        </>
      )}
    </Link>
  );
}

/** Sign-in link that returns the user to the current page after auth. */
export function LoginLink({
  children,
  className,
  fallbackNext = '/',
}: {
  children?: ReactNode;
  className?: string;
  fallbackNext?: string;
}) {
  return (
    <Suspense
      fallback={
        <Link className={className} href={buildLoginHref(fallbackNext)}>
          {children ?? (
            <>
              <LogIn aria-hidden="true" className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Login</span>
            </>
          )}
        </Link>
      }
    >
      <LoginLinkInner className={className} fallbackNext={fallbackNext}>
        {children}
      </LoginLinkInner>
    </Suspense>
  );
}
