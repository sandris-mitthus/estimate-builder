import { UserAvatar } from "@/app/components/user-avatar";

type UserListCardProps = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

export function UserListCard({ name, email, avatarUrl }: UserListCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <UserAvatar avatarUrl={avatarUrl} name={name} />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-900">{name}</p>
          <p className="mt-0.5 truncate text-sm text-zinc-600">{email}</p>
        </div>
      </div>
    </div>
  );
}
