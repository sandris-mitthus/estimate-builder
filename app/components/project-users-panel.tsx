"use client";

import { useDraggable } from "@dnd-kit/core";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import type { UserSummary } from "@/app/lib/users/types";

type ProjectUsersPanelProps = {
  users: UserSummary[];
  dragEnabled?: boolean;
};

function DraggableUserRow({
  user,
  dragEnabled,
}: {
  user: UserSummary;
  dragEnabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `delegation-user:${user.id}`,
      data: { type: "delegation-user", userId: user.id },
      disabled: !dragEnabled,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? "relative z-10 opacity-60" : undefined}
    >
      <div
        className={`flex items-center gap-4 px-4 py-3 ${
          dragEnabled
            ? "cursor-grab touch-none active:cursor-grabbing"
            : ""
        }`}
        {...(dragEnabled ? { ...listeners, ...attributes } : {})}
      >
        <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-zinc-900">
            {user.name}
          </p>
          <p className="mt-0.5 truncate text-sm text-zinc-600">{user.email}</p>
        </div>
        {dragEnabled ? (
          <i
            className="fas fa-grip-vertical shrink-0 text-xs text-zinc-300"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </li>
  );
}

export function ProjectUsersPanel({
  users,
  dragEnabled = false,
}: ProjectUsersPanelProps) {
  const { t } = useTranslations();

  if (users.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="project-users-heading"
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
    >
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3">
        <h2
          id="project-users-heading"
          className="text-sm font-semibold text-zinc-900"
        >
          {t("nav.users", "Lietotāji")}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {dragEnabled
            ? t(
                "materials.assign.drag_hint",
                "Velc lietotāju uz materiālu, lai piešķirtu pasūtīšanu",
              )
            : t("users.page.subtitle", "{count} lietotāji sistēmā", {
                count: users.length,
              })}
        </p>
      </div>

      <ul className="divide-y divide-zinc-100">
        {users.map((user) => (
          <DraggableUserRow
            key={user.id}
            user={user}
            dragEnabled={dragEnabled}
          />
        ))}
      </ul>
    </section>
  );
}
