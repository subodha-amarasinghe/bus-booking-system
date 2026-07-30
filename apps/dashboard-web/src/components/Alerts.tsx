import { CircleAlert, CircleCheck } from 'lucide-react';

export function ErrorAlert({ message }: { message: string }) {
  return (
    <p role="alert" className="ui-alert-error flex items-start gap-2">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <p role="status" className="ui-alert-success flex items-start gap-2">
      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
