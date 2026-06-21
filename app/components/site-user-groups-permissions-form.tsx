"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createSiteUserGroupAction,
  deleteSiteUserGroupAction,
  updateSiteUserGroupPermissionsAction,
} from "@/app/(protected)/site_user_groups/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import {
  ACTION_PERMISSION_GROUPS,
  ACTION_PERMISSION_LABELS,
  NAV_PERMISSION_KEYS,
  NAV_PERMISSION_LABELS,
  type PermissionSet,
} from "@/app/lib/auth/permissions";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { SiteUserGroupSummary } from "@/app/lib/site-admin/repository";

function clonePermissions(permissions: PermissionSet): PermissionSet {
  return {
    nav: { ...permissions.nav },
    actions: { ...permissions.actions },
  };
}

export function SiteUserGroupsPermissionsForm({
  groups,
}: {
  groups: SiteUserGroupSummary[];
}) {
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? "");
  const [newGroupName, setNewGroupName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SiteUserGroupSummary | null>(
    null,
  );
  const [pendingAction, setPendingAction] = useState<
    "create" | "delete" | "permissions" | null
  >(null);
  const [draftByGroupId, setDraftByGroupId] = useState<Record<string, PermissionSet>>(
    () =>
      Object.fromEntries(
        groups.map((group) => [group.id, clonePermissions(group.permissions)]),
      ),
  );
  const [savedByGroupId, setSavedByGroupId] = useState<Record<string, PermissionSet>>(
    () =>
      Object.fromEntries(
        groups.map((group) => [group.id, clonePermissions(group.permissions)]),
      ),
  );
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingAction !== null;

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );
  const draft = selectedGroup ? draftByGroupId[selectedGroup.id] : null;
  const saved = selectedGroup ? savedByGroupId[selectedGroup.id] : null;
  const hasChanges =
    draft !== null &&
    saved !== null &&
    JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => {
    const nextPermissions = Object.fromEntries(
      groups.map((group) => [group.id, clonePermissions(group.permissions)]),
    );
    setDraftByGroupId(nextPermissions);
    setSavedByGroupId(nextPermissions);
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

  function updateNav(key: keyof PermissionSet["nav"], enabled: boolean) {
    if (!selectedGroup) {
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
    clearFeedback();
  }

  function updateAction(key: keyof PermissionSet["actions"], enabled: boolean) {
    if (!selectedGroup) {
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
    clearFeedback();
  }

  function handleCreateGroup() {
    const trimmedName = newGroupName.trim();
    if (!trimmedName || isBusy) {
      return;
    }

    startTransition(async () => {
      setPendingAction("create");
      const result = await createSiteUserGroupAction(trimmedName);

      if (!result.ok) {
        setPendingAction(null);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setNewGroupName("");
      setSelectedGroupId(result.group.id);
      setPendingAction(null);
      showFeedback({
        type: "success",
        text: t("site_user_groups.feedback.created", "Grupa izveidota."),
      });
    });
  }

  function handleSave() {
    if (!selectedGroup || !draft || !hasChanges || isBusy) {
      return;
    }

    startTransition(async () => {
      setPendingAction("permissions");
      const result = await updateSiteUserGroupPermissionsAction(
        selectedGroup.id,
        draft,
      );

      if (result.ok) {
        setSavedByGroupId((current) => ({
          ...current,
          [selectedGroup.id]: clonePermissions(draft),
        }));
        setPendingAction(null);
        showFeedback({
          type: "success",
          text: t(
            "site_user_groups.feedback.permissions_saved",
            "Sistēmas grupas tiesības saglabātas.",
          ),
        });
        return;
      }

      setPendingAction(null);
      showFeedback({ type: "error", text: translateActionError(t, result) });
    });
  }

  function handleDeleteGroup() {
    if (!deleteTarget || isBusy) {
      return;
    }

    startTransition(async () => {
      setPendingAction("delete");
      const result = await deleteSiteUserGroupAction(deleteTarget.id);

      if (!result.ok) {
        setPendingAction(null);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setDeleteTarget(null);
      setSelectedGroupId(
        groups.find((group) => group.id !== deleteTarget.id)?.id ?? "",
      );
      setPendingAction(null);
      showFeedback({
        type: "success",
        text: t("site_user_groups.feedback.deleted", "Grupa dzēsta."),
      });
    });
  }

  if (!selectedGroup || !draft) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        {t("site_user_groups.empty", "Nav atrasta neviena sistēmas grupa.")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">
          {t("site_user_groups.create.title", "Jauna grupa")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {t(
            "site_user_groups.create.description",
            "Izveido sistēmas grupu un pēc tam izvēlies tās tiesības zemāk.",
          )}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newGroupName}
            onChange={(event) => {
              setNewGroupName(event.target.value);
              clearFeedback();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreateGroup();
              }
            }}
            disabled={isBusy}
            placeholder={t(
              "user_groups.name_placeholder",
              "Piemēram, Projektu vadītājs",
            )}
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={isBusy || !newGroupName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {pendingAction === "create"
              ? t("actions.creating", "Veido…")
              : t("site_user_groups.create.action", "Izveidot grupu")}
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {groups.map((group) => {
          const isActive = group.id === selectedGroupId;

          return (
            <span
              key={group.id}
              className={`inline-flex items-center overflow-hidden rounded-full border text-sm font-medium transition ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className="px-4 py-2"
              >
                {group.name}
              </button>
              <Tooltip
                label={t("site_user_groups.delete.named_action", "Dzēst grupu {name}", {
                  name: group.name,
                })}
              >
                <button
                  type="button"
                  aria-label={t(
                    "site_user_groups.delete.named_action",
                    "Dzēst grupu {name}",
                    { name: group.name },
                  )}
                  onClick={() => setDeleteTarget(group)}
                  className={`inline-flex size-8 items-center justify-center rounded-full transition ${
                    isActive
                      ? "text-white/70 hover:bg-white/10 hover:text-white"
                      : "text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <i className="fas fa-trash text-[11px]" aria-hidden="true" />
                </button>
              </Tooltip>
            </span>
          );
        })}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {t("site_user_groups.card.eyebrow", "Sistēmas default grupa")}
        </p>
        <h2 className="mt-1 text-base font-semibold text-zinc-900">
          {selectedGroup.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {selectedGroup.description ||
            t(
              "site_user_groups.default_description",
              "Šīs tiesības tiek izmantotas kā sistēmas noklusējums.",
            )}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            {t("permissions.nav_visibility.title", "Redzamība navigācijā")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {t(
              "site_user_groups.nav_visibility.description",
              "Kuras sadaļas šī default grupa redz augšējā izvēlnē.",
            )}
          </p>
          <ul className="mt-4 space-y-3">
            {NAV_PERMISSION_KEYS.filter((key) => key !== "user_groups").map((key) => (
              <li key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-800">
                  {t(`permissions.nav.${key}`, NAV_PERMISSION_LABELS[key])}
                </span>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={draft.nav[key]}
                    disabled={isBusy}
                    onChange={(event) => updateNav(key, event.target.checked)}
                    className="size-4 rounded border-zinc-300"
                  />
                  {t("permissions.visible", "Redzams")}
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            {t("permissions.actions.title", "Darbības")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {t(
              "site_user_groups.actions.description",
              "Ko šī default grupa drīkst veikt sistēmā.",
            )}
          </p>
          <div className="mt-4 space-y-5">
            {ACTION_PERMISSION_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-zinc-800">
                  {t(group.titleKey, group.title)}
                </h3>
                <ul className="mt-2 space-y-2">
                  {group.keys.map((key) => (
                    <li key={key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-700">
                        {t(`permissions.actions.${key}`, ACTION_PERMISSION_LABELS[key])}
                      </span>
                      <input
                        type="checkbox"
                        checked={draft.actions[key]}
                        disabled={isBusy}
                        onChange={(event) =>
                          updateAction(key, event.target.checked)
                        }
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy || !hasChanges}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "permissions" ? (
            <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
          ) : null}
          {pendingAction === "permissions"
            ? t("actions.saving", "Saglabā…")
            : t("site_user_groups.permissions.save", "Saglabāt grupas tiesības")}
        </button>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("site_user_groups.delete.title", "Dzēst grupu?")}
        description={
          <>
            {t("site_user_groups.delete.confirm_prefix", "Vai tiešām dzēst grupu")}{" "}
            <span className="font-semibold text-zinc-900">
              {deleteTarget?.name}
            </span>
            ?
          </>
        }
        confirmLabel={
          pendingAction === "delete"
            ? t("actions.deleting", "Dzēš…")
            : t("actions.delete", "Dzēst")
        }
        confirmVariant="danger"
        blocking={pendingAction === "delete"}
        onConfirm={handleDeleteGroup}
      />
    </div>
  );
}
