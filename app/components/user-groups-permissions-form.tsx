"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateUserGroupPermissionsAction } from "@/app/(protected)/users/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import {
  ACTION_PERMISSION_GROUPS,
  ACTION_PERMISSION_LABELS,
  NAV_PERMISSION_KEYS,
  NAV_PERMISSION_LABELS,
  type PermissionSet,
  type UserGroupSummary,
} from "@/app/lib/auth/permissions";

type UserGroupsPermissionsFormProps = {
  groups: UserGroupSummary[];
  canManage: boolean;
};

function clonePermissions(permissions: PermissionSet): PermissionSet {
  return {
    nav: { ...permissions.nav },
    actions: { ...permissions.actions },
  };
}

export function UserGroupsPermissionsForm({
  groups,
  canManage,
}: UserGroupsPermissionsFormProps) {
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? "");
  const [draftByGroupId, setDraftByGroupId] = useState<Record<string, PermissionSet>>(
    () =>
      Object.fromEntries(
        groups.map((group) => [group.id, clonePermissions(group.permissions)]),
      ),
  );
  const [isPending, startTransition] = useTransition();

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const draft = selectedGroup ? draftByGroupId[selectedGroup.id] : null;

  function updateNav(key: keyof PermissionSet["nav"], enabled: boolean) {
    if (!selectedGroup || !draft) {
      return;
    }

    setDraftByGroupId((current) => ({
      ...current,
      [selectedGroup.id]: {
        ...current[selectedGroup.id],
        nav: {
          ...current[selectedGroup.id].nav,
          [key]: enabled,
        },
      },
    }));
  }

  function updateAction(key: keyof PermissionSet["actions"], enabled: boolean) {
    if (!selectedGroup || !draft) {
      return;
    }

    setDraftByGroupId((current) => ({
      ...current,
      [selectedGroup.id]: {
        ...current[selectedGroup.id],
        actions: {
          ...current[selectedGroup.id].actions,
          [key]: enabled,
        },
      },
    }));
  }

  function handleSave() {
    if (!selectedGroup || !draft || !canManage) {
      return;
    }

    startTransition(async () => {
      const result = await updateUserGroupPermissionsAction(
        selectedGroup.id,
        draft,
      );

      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        return;
      }

      showFeedback({ type: "success", text: "Grupas tiesības saglabātas." });
      router.refresh();
    });
  }

  if (!selectedGroup || !draft) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {groups.map((group) => {
          const isActive = group.id === selectedGroupId;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {group.name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Redzamība navigācijā</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Kuras sadaļas lietotājs redz augšējā izvēlnē.
          </p>
          <ul className="mt-4 space-y-3">
            {NAV_PERMISSION_KEYS.filter((key) => key !== "user_groups").map((key) => (
              <li key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-800">{NAV_PERMISSION_LABELS[key]}</span>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={draft.nav[key]}
                    disabled={!canManage}
                    onChange={(event) => updateNav(key, event.target.checked)}
                    className="size-4 rounded border-zinc-300"
                  />
                  Redzams
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Darbības</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Ko lietotājs drīkst veikt sistēmā.
          </p>
          <div className="mt-4 space-y-5">
            {ACTION_PERMISSION_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-zinc-800">{group.title}</h3>
                <ul className="mt-2 space-y-2">
                  {group.keys.map((key) => (
                    <li key={key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-700">
                        {ACTION_PERMISSION_LABELS[key]}
                      </span>
                      <input
                        type="checkbox"
                        checked={draft.actions[key]}
                        disabled={!canManage}
                        onChange={(event) => updateAction(key, event.target.checked)}
                        className="size-4 rounded border-zinc-300"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {canManage ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saglabā…" : "Saglabāt grupas tiesības"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Tikai administratori var mainīt grupu tiesības.
        </p>
      )}
    </div>
  );
}
