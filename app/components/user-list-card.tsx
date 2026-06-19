import { UserAvatar } from "@/app/components/user-avatar";
import type { ReactNode } from "react";

type UserListCardProps = {
  name: string;
  email: string;
  avatarUrl: string | null;
  footer?: ReactNode;
  actions?: ReactNode;
  statusLabel?: string | null;
};

export function UserListCard({
  name,
  email,
  avatarUrl,
  footer,
  actions,
  statusLabel,
}: UserListCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
        <UserAvatar avatarUrl={avatarUrl} name={name} />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-zinc-900">{name}</p>
            {statusLabel ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {statusLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-zinc-600">{email}</p>
        </div>
        </div>
        {actions ? <div className="-mr-1 -mt-1 shrink-0">{actions}</div> : null}
      </div>
      {footer}
    </div>
  );
}
