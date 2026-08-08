import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPassengerSession } from '../../lib/auth';
import { buildLoginHref } from '../../lib/format';

/** Must match the header set in `middleware.ts`. */
const RETURN_TO_HEADER = 'x-return-to';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPassengerSession();
  if (!session) {
    const returnTo = headers().get(RETURN_TO_HEADER) ?? '/';
    redirect(buildLoginHref(returnTo));
  }
  return children;
}
