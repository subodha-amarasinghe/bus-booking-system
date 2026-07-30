'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import type { z } from 'zod';
import { Search, ShieldCheck, UserCog, Users } from 'lucide-react';
import {
  GetProfileRequestSchema,
  ManageCustomersRequestSchema,
  ManageInternalRequestSchema,
  UserRole,
  type User,
} from '@bus-booking/shared-types';
import { ErrorAlert, SuccessAlert } from '../../components/Alerts';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { PageHeader } from '../../components/PageHeader';
import { RequireRole } from '../../components/RequireRole';
import { SectionCard } from '../../components/SectionCard';
import { Spinner } from '../../components/LoadingBlock';
import { StatusBadge } from '../../components/StatusBadge';
import { errorMessage, postJson } from '../../lib/client-api';

type LookupFormValues = z.infer<typeof GetProfileRequestSchema>;
type InternalFormValues = z.infer<typeof ManageInternalRequestSchema>;
type CustomerFormValues = z.infer<typeof ManageCustomersRequestSchema>;

const SEEDED_ADMIN_ID = 'a0000000-0000-4000-8000-000000000001';
const SEEDED_PASSENGER_ID = 'a0000000-0000-4000-8000-000000000003';

/** Blank optional inputs mean "leave unchanged", not "clear the value". */
const optionalText = {
  setValueAs: (value: string) => (value.trim() === '' ? undefined : value.trim()),
} as const;

const optionalFlag = {
  setValueAs: (value: string) =>
    value === '' ? undefined : value === 'true',
} as const;

function ProfileCard({ user }: { user: User }) {
  return (
    <dl className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-400">Name</dt>
        <dd className="text-sm font-medium text-slate-900">{user.name}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-400">Role</dt>
        <dd className="mt-0.5 flex items-center gap-2">
          <StatusBadge status={user.role} />
          <StatusBadge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-400">Phone</dt>
        <dd className="text-sm text-slate-700">{user.phone}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
        <dd className="text-sm text-slate-700">{user.email ?? '—'}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase tracking-wide text-slate-400">
          User ID
        </dt>
        <dd className="break-all font-mono text-xs text-slate-500">{user.id}</dd>
      </div>
    </dl>
  );
}

function ProfileLookup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LookupFormValues>({
    resolver: zodResolver(GetProfileRequestSchema),
  });

  const lookup = useMutation({
    mutationFn: (values: LookupFormValues) =>
      postJson<User>('/api/users/profile/get', values),
  });

  return (
    <SectionCard
      title="Look up a profile"
      description="Search by user ID to confirm who you are helping before making changes."
      icon={Search}
    >
      <form
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        onSubmit={handleSubmit((values) => lookup.mutate(values))}
      >
        <Field
          label="User ID"
          htmlFor="lookupUserId"
          hint={`Seeded examples — admin ${SEEDED_ADMIN_ID}, passenger ${SEEDED_PASSENGER_ID}`}
          error={errors.userId ? 'Enter a valid user ID (UUID).' : undefined}
        >
          <input
            id="lookupUserId"
            className="ui-input font-mono text-xs"
            placeholder={SEEDED_PASSENGER_ID}
            {...register('userId')}
          />
        </Field>
        <button
          type="submit"
          className="ui-btn-primary"
          disabled={lookup.isPending}
        >
          {lookup.isPending ? <Spinner /> : <Search className="h-4 w-4" aria-hidden />}
          {lookup.isPending ? 'Looking up…' : 'Look up'}
        </button>
      </form>

      <div className="mt-4">
        {lookup.isError ? (
          <ErrorAlert message={errorMessage(lookup.error)} />
        ) : lookup.data ? (
          <ProfileCard user={lookup.data} />
        ) : (
          <EmptyState
            icon={Users}
            title="No profile loaded"
            description="Paste a user ID above to see their contact details, role and status."
          />
        )}
      </div>
    </SectionCard>
  );
}

function InternalStaffForm() {
  const [savedName, setSavedName] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InternalFormValues>({
    resolver: zodResolver(ManageInternalRequestSchema),
    defaultValues: { role: UserRole.CUSTOMER_STAFF },
  });

  const manageInternal = useMutation({
    mutationFn: (values: InternalFormValues) =>
      postJson<User>('/api/users/manage/internal', values),
    onSuccess: (user) => {
      setSavedName(user.name);
      reset({ role: UserRole.CUSTOMER_STAFF });
    },
  });

  return (
    <SectionCard
      title="Internal staff"
      description="Update a staff member's role, contact details or access. Admin staff only."
      icon={UserCog}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          setSavedName(null);
          manageInternal.mutate(values);
        })}
      >
        <Field
          label="User ID"
          htmlFor="internalUserId"
          error={errors.userId ? 'Enter a valid user ID (UUID).' : undefined}
        >
          <input
            id="internalUserId"
            className="ui-input font-mono text-xs"
            placeholder={SEEDED_ADMIN_ID}
            {...register('userId')}
          />
        </Field>

        <Field label="Role" htmlFor="internalRole">
          <select id="internalRole" className="ui-select" {...register('role')}>
            <option value={UserRole.ADMIN_STAFF}>Admin staff</option>
            <option value={UserRole.CUSTOMER_STAFF}>Customer staff</option>
          </select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="internalName" hint="Leave blank to keep.">
            <input
              id="internalName"
              className="ui-input"
              {...register('name', optionalText)}
            />
          </Field>
          <Field label="Phone" htmlFor="internalPhone" hint="Leave blank to keep.">
            <input
              id="internalPhone"
              className="ui-input"
              {...register('phone', optionalText)}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Email"
            htmlFor="internalEmail"
            hint="Leave blank to keep."
            error={errors.email ? 'Enter a valid email address.' : undefined}
          >
            <input
              id="internalEmail"
              type="email"
              className="ui-input"
              {...register('email', optionalText)}
            />
          </Field>
          <Field label="Access" htmlFor="internalActive">
            <select
              id="internalActive"
              className="ui-select"
              defaultValue=""
              {...register('isActive', optionalFlag)}
            >
              <option value="">No change</option>
              <option value="true">Active</option>
              <option value="false">Suspended</option>
            </select>
          </Field>
        </div>

        {manageInternal.isError ? (
          <ErrorAlert message={errorMessage(manageInternal.error)} />
        ) : null}
        {savedName ? (
          <SuccessAlert message={`${savedName}'s staff account was updated.`} />
        ) : null}

        <button
          type="submit"
          className="ui-btn-primary"
          disabled={manageInternal.isPending}
        >
          {manageInternal.isPending ? <Spinner /> : null}
          {manageInternal.isPending ? 'Saving…' : 'Save staff changes'}
        </button>
      </form>
    </SectionCard>
  );
}

function CustomersForm() {
  const [savedName, setSavedName] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(ManageCustomersRequestSchema),
  });

  const manageCustomer = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      postJson<User>('/api/users/manage/customers', values),
    onSuccess: (user) => {
      setSavedName(user.name);
      reset();
    },
  });

  return (
    <SectionCard
      title="Customers"
      description="Correct a passenger's details or suspend an account."
      icon={Users}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          setSavedName(null);
          manageCustomer.mutate(values);
        })}
      >
        <Field
          label="User ID"
          htmlFor="customerUserId"
          hint={`Seeded passenger — ${SEEDED_PASSENGER_ID}`}
          error={errors.userId ? 'Enter a valid user ID (UUID).' : undefined}
        >
          <input
            id="customerUserId"
            className="ui-input font-mono text-xs"
            placeholder={SEEDED_PASSENGER_ID}
            {...register('userId')}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="customerName" hint="Leave blank to keep.">
            <input
              id="customerName"
              className="ui-input"
              {...register('name', optionalText)}
            />
          </Field>
          <Field label="Phone" htmlFor="customerPhone" hint="Leave blank to keep.">
            <input
              id="customerPhone"
              className="ui-input"
              {...register('phone', optionalText)}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Email"
            htmlFor="customerEmail"
            hint="Leave blank to keep."
            error={errors.email ? 'Enter a valid email address.' : undefined}
          >
            <input
              id="customerEmail"
              type="email"
              className="ui-input"
              {...register('email', optionalText)}
            />
          </Field>
          <Field label="Access" htmlFor="customerActive">
            <select
              id="customerActive"
              className="ui-select"
              defaultValue=""
              {...register('isActive', optionalFlag)}
            >
              <option value="">No change</option>
              <option value="true">Active</option>
              <option value="false">Suspended</option>
            </select>
          </Field>
        </div>

        {manageCustomer.isError ? (
          <ErrorAlert message={errorMessage(manageCustomer.error)} />
        ) : null}
        {savedName ? (
          <SuccessAlert message={`${savedName}'s profile was updated.`} />
        ) : null}

        <button
          type="submit"
          className="ui-btn-primary"
          disabled={manageCustomer.isPending}
        >
          {manageCustomer.isPending ? <Spinner /> : null}
          {manageCustomer.isPending ? 'Saving…' : 'Save customer changes'}
        </button>
      </form>
    </SectionCard>
  );
}

export function UserManagementPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="Look up any account, fix passenger details, and manage staff access."
        icon={Users}
      />

      <div className="space-y-6">
        <ProfileLookup />

        <div className="grid gap-6 lg:grid-cols-2">
          <RequireRole
            allowed={[UserRole.ADMIN_STAFF]}
            fallback={
              <SectionCard title="Internal staff" icon={UserCog}>
                <EmptyState
                  icon={ShieldCheck}
                  title="Admin staff only"
                  description="Staff roles and access can only be changed by an admin."
                />
              </SectionCard>
            }
          >
            <InternalStaffForm />
          </RequireRole>

          <RequireRole
            allowed={[UserRole.ADMIN_STAFF, UserRole.CUSTOMER_STAFF]}
          >
            <CustomersForm />
          </RequireRole>
        </div>
      </div>
    </>
  );
}
