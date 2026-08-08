'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Spinner } from '../../shared/components/LoadingBlock';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/');
    router.refresh();
  }

  return (
    <button
      className="ui-btn-ghost min-h-[48px] w-full border border-slate-200 dark:border-slate-700 sm:w-auto"
      disabled={pending}
      onClick={logout}
      type="button"
    >
      {pending ? <Spinner /> : <LogOut aria-hidden="true" className="h-4 w-4" />}
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
