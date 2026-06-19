"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createUserGroupAction,
  deleteUserGroupAction,
  updateUserGroupNameAction,
  updateUserGroupPermissionsAction,
} from "@/app/(protected)/users/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
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
  canManageCompanyGroups: boolean;
  canManageSystemGroups: boolean;
};

type PendingAction = "create" | "rename" | "delete" | "permissions" | null;

function clonePermissions(permissions: PermissionSet): PermissionSet {
  return {
    nav: { ...permissions.nav },
    actions: { ...permissions.actions },
  };
}

export function UserGroupsPermissionsForm({
  groups,
  canManageCompanyGroups,
  canManageSystemGroups,
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
  const [newGroupName, setNewGroupName] = useState("");
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const draft = selectedGroup ? draftByGroupId[selectedGroup.id] : null;
  const isBusy = isPending || pendingAction !== null;
  const canEditSelectedGroupName =
    canManageCompanyGroups && selectedGroup !== null && !selectedGroup.isSystem;
  const canEditSelectedPermissions =
    selectedGroup !== null &&
    (selectedGroup.isSystem ? canManageSystemGroups : canManageCompanyGroups);

  useEffect(() => {
    setDraftByGroupId(
      Object.fromEntries(
        groups.map((group) => [group.id, clonePermissions(group.permissions)]),
      ),
    );
  }, [groups]);

  useEffect(() => {
    if (groups.length === 0) {
      setSelectedGroupId("");
      return;
    }

    if (!groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    setGroupNameDraft(selectedGroup?.name ?? "");
  }, [selectedGroup]);

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
    if (!selectedGroup || !draft || !canEditSelectedPermissions) {
      return;
    }

    startTransition(async () => {
      setPendingAction("permissions");
      const result = await updateUserGroupPermissionsAction(
        selectedGroup.id,
        draft,
      );

      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        setPendingAction(null);
        return;
      }

      showFeedback({ type: "success", text: "Grupas tiesības saglabātas." });
      router.refresh();
      setPendingAction(null);
    });
  }

  function handleCreateGroup() {
    const trimmedName = newGroupName.trim();
    if (!trimmedName || !canManageCompanyGroups) {
      return;
    }

    startTransition(async () => {
      setPendingAction("create");
      const result = await createUserGroupAction(trimmedName);

      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        setPendingAction(null);
        return;
      }

      setNewGroupName("");
      setSelectedGroupId(result.group.id);
      showFeedback({ type: "success", text: "Grupa izveidota." });
      router.refresh();
      setPendingAction(null);
    });
  }

  function handleRenameGroup() {
    if (!selectedGroup || !canEditSelectedGroupName) {
      return;
    }

    const trimmedName = groupNameDraft.trim();
    if (!trimmedName || trimmedName === selectedGroup.name) {
      return;
    }

    startTransition(async () => {
      setPendingAction("rename");
      const result = await updateUserGroupNameAction(selectedGroup.id, trimmedName);

      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        setPendingAction(null);
        return;
      }

      showFeedback({ type: "success", text: "Grupas nosaukums saglabāts." });
      router.refresh();
      setPendingAction(null);
    });
  }

  function handleDeleteGroup() {
    if (!selectedGroup || !canEditSelectedGroupName) {
      return;
    }

    startTransition(async () => {
      setPendingAction("delete");
      const result = await deleteUserGroupAction(selectedGroup.id);

      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        setPendingAction(null);
        return;
      }

      setDeleteModalOpen(false);
      setSelectedGroupId(groups.find((group) => group.id !== selectedGroup.id)?.id ?? "");
      showFeedback({ type: "success", text: "Grupa dzēsta." });
      router.refresh();
      setPendingAction(null);
    });
  }

  if (!selectedGroup || !draft) {
    return null;
  }

  return (
    <div className="space-y-6">
      {canManageCompanyGroups ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Jauna grupa</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Izveido uzņēmuma grupu un pēc tam izvēlies tās tiesības zemāk.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateGroup();
                }
              }}
              disabled={isBusy}
              placeholder="Piemēram, Projektu vadītājs"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isBusy || !newGroupName.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fas fa-plus text-xs" aria-hidden="true" />
              {pendingAction === "create" ? "Veido…" : "Izveidot grupu"}
            </button>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {groups.map((group) => {
          const isActive = group.id === selectedGroupId;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
              className={`flex flex-col items-center rounded-full border px-4 py-2 text-sm font-medium leading-tight transition ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <span>{group.name}</span>
              {!group.isSystem ? (
                <span className="mt-0.5 text-[10px] font-medium text-current opacity-70">
                  uzņēmuma
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {selectedGroup.isSystem ? "Sistēmas grupa" : "Uzņēmuma grupa"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {selectedGroup.isSystem ? (
                canManageSystemGroups ? (
                  "Šī ir pamata grupa. Nosaukumu un dzēšanu nevar mainīt, bet sistēmas administrators var labot pieejas."
                ) : (
                  "Šī ir pamata grupa. Uzņēmuma lietotāji to var tikai apskatīt."
                )
              ) : (
                "Šo grupu uzņēmums var pārsaukt, dzēst un mainīt tās pieejas, ja tai nav lietotāju."
              )}
            </p>
          </div>

          {canEditSelectedGroupName ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <input
                type="text"
                value={groupNameDraft}
                onChange={(event) => setGroupNameDraft(event.target.value)}
                disabled={isBusy}
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 lg:w-72"
              />
              <button
                type="button"
                onClick={handleRenameGroup}
                disabled={
                  isBusy ||
                  !groupNameDraft.trim() ||
                  groupNameDraft.trim() === selectedGroup.name
                }
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAction === "rename" ? "Saglabā…" : "Pārsaukt"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="fas fa-trash text-xs" aria-hidden="true" />
                Dzēst
              </button>
            </div>
          ) : null}
        </div>
      </section>

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
                    disabled={!canEditSelectedPermissions || isBusy}
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
                        disabled={!canEditSelectedPermissions || isBusy}
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

      {canEditSelectedPermissions ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isBusy}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "permissions"
              ? "Saglabā…"
              : "Saglabāt grupas tiesības"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          {selectedGroup.isSystem
            ? "Sistēmas profilu tiesības var mainīt tikai sistēmas administrators."
            : "Tikai uzņēmuma administratori var mainīt uzņēmuma profilu tiesības."}
        </p>
      )}

      <ConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Dzēst grupu?"
        description={
          <>
            Vai tiešām dzēst grupu{" "}
            <span className="font-semibold text-zinc-900">{selectedGroup.name}</span>?
            Šo darbību nevar atsaukt.
          </>
        }
        confirmLabel="Dzēst"
        confirmVariant="danger"
        blocking={pendingAction === "delete"}
        onConfirm={handleDeleteGroup}
      />
    </div>
  );
}
