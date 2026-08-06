"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeCompanyUserAction,
  setCompanyUserAccessAction,
} from "@/app/(protected)/users/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { ListEntryGrid } from "@/app/components/list-entry-card";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { Tooltip } from "@/app/components/tooltip";
import { UserGroupSelect } from "@/app/components/user-group-select";
import { UserListCard } from "@/app/components/user-list-card";
import { useTranslations } from "@/app/components/translations-provider";
import type { UserGroupSummary } from "@/app/lib/auth/permissions";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { UserSummary } from "@/app/lib/users/types";

function statusLabel(
  status: UserSummary["companyStatus"],
  t: (key: string, fallback?: string) => string,
) {
  if (status === "disabled") {
    return t("user_status.disabled", "Pieeja liegta");
  }

  if (status === "invited") {
    return t("user_status.invited", "Uzaicināts");
  }

  return null;
}

type UsersListProps = {
  initialUsers: UserSummary[];
  groups: UserGroupSummary[];
  memberships: Record<string, string>;
  defaultGroupId: string;
  currentUserId: string | null;
  currentUserEmail: string | null;
  canAssignGroup: boolean;
  canManageCompanyAccess: boolean;
};

type PendingDialog =
  | { type: "access"; user: UserSummary }
  | { type: "remove"; user: UserSummary }
  | null;

const actionButtonClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60";

export function UsersList({
  initialUsers,
  groups,
  memberships,
  defaultGroupId,
  currentUserId,
  currentUserEmail,
  canAssignGroup,
  canManageCompanyAccess,
}: UsersListProps) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [users, setUsers] = useState(initialUsers);
  const [pendingDialog, setPendingDialog] = useState<PendingDialog>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  function isCurrentUser(user: UserSummary) {
    return (
      currentUserId === user.id ||
      (currentUserEmail != null &&
        currentUserEmail.toLowerCase() === user.email.toLowerCase())
    );
  }

  function closeDialog() {
    if (!isPending) {
      setPendingDialog(null);
    }
  }

  function confirmAccessChange() {
    if (!pendingDialog || pendingDialog.type !== "access") {
      return;
    }

    const target = pendingDialog.user;
    const previousStatus = target.companyStatus;
    const nextStatus = previousStatus === "disabled" ? "active" : "disabled";

    clearFeedback();
    setPendingDialog(null);
    setBusyUserId(target.id);
    setUsers((current) =>
      current.map((user) =>
        user.id === target.id ? { ...user, companyStatus: nextStatus } : user,
      ),
    );

    startTransition(async () => {
      const result = await setCompanyUserAccessAction(target.id, nextStatus);
      setBusyUserId(null);

      if (!result.ok) {
        setUsers((current) =>
          current.map((user) =>
            user.id === target.id
              ? { ...user, companyStatus: previousStatus }
              : user,
          ),
        );
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text:
          previousStatus === "disabled"
            ? t("users.access.feedback.restored", "Lietotāja pieeja atjaunota.")
            : t("users.access.feedback.disabled", "Lietotāja pieeja liegta."),
      });
      router.refresh();
    });
  }

  function confirmRemove() {
    if (!pendingDialog || pendingDialog.type !== "remove") {
      return;
    }

    const target = pendingDialog.user;
    const previousUsers = users;
    const leavingSelf = isCurrentUser(target);

    clearFeedback();
    setPendingDialog(null);
    setBusyUserId(target.id);
    // Live remove — card disappears immediately so it cannot be deleted twice.
    setUsers((current) => current.filter((user) => user.id !== target.id));

    startTransition(async () => {
      const result = await removeCompanyUserAction(target.id);
      setBusyUserId(null);

      if (!result.ok) {
        setUsers(previousUsers);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: leavingSelf
          ? t("users.remove.feedback.left_company", "Jūs pametāt uzņēmumu.")
          : t("users.remove.feedback.removed", "Lietotājs noņemts no uzņēmuma."),
      });
      router.refresh();
    });
  }

  const dialogUser = pendingDialog?.user ?? null;
  const dialogIsDisabled = dialogUser?.companyStatus === "disabled";
  const dialogIsCurrent = dialogUser ? isCurrentUser(dialogUser) : false;

  return (
    <>
      <ListEntryGrid>
        {users.map((user) => {
          const current = isCurrentUser(user);
          const canRemove = canManageCompanyAccess || current;
          const rowBusy = busyUserId === user.id;

          return (
            <UserListCard
              key={user.id}
              name={user.name}
              email={user.email}
              avatarUrl={user.avatarUrl}
              statusLabel={statusLabel(user.companyStatus, t)}
              actions={
                <div className="flex items-center gap-1">
                  {canManageCompanyAccess && !current ? (
                    <Tooltip
                      label={
                        user.companyStatus === "disabled"
                          ? t("users.access.restore", "Atjaunot pieeju")
                          : t("users.access.disable", "Liegt pieeju")
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDialog({ type: "access", user })
                        }
                        disabled={rowBusy}
                        aria-label={
                          user.companyStatus === "disabled"
                            ? t("users.access.restore", "Atjaunot pieeju")
                            : t("users.access.disable", "Liegt pieeju")
                        }
                        className={actionButtonClassName}
                      >
                        <i
                          className={`fas ${
                            user.companyStatus === "disabled"
                              ? "fa-lock"
                              : "fa-lock-open"
                          } text-sm`}
                          aria-hidden="true"
                        />
                      </button>
                    </Tooltip>
                  ) : null}

                  {canRemove ? (
                    <Tooltip
                      label={
                        current
                          ? t("users.remove.leave_company", "Pamest uzņēmumu")
                          : t("users.remove.from_company", "Noņemt no uzņēmuma")
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDialog({ type: "remove", user })
                        }
                        disabled={rowBusy}
                        aria-label={
                          current
                            ? t("users.remove.leave_company", "Pamest uzņēmumu")
                            : t(
                                "users.remove.from_company",
                                "Noņemt no uzņēmuma",
                              )
                        }
                        className={`${actionButtonClassName} hover:bg-red-50 hover:text-red-600`}
                      >
                        <i className="fas fa-times text-sm" aria-hidden="true" />
                      </button>
                    </Tooltip>
                  ) : null}
                </div>
              }
              footer={
                canAssignGroup ? (
                  <UserGroupSelect
                    userId={user.id}
                    groupId={memberships[user.id] ?? defaultGroupId}
                    groups={groups}
                    disabled={user.companyStatus === "disabled" || rowBusy}
                  />
                ) : null
              }
            />
          );
        })}
      </ListEntryGrid>

      <ConfirmModal
        open={pendingDialog?.type === "access"}
        onOpenChange={(open) =>
          open && dialogUser
            ? setPendingDialog({ type: "access", user: dialogUser })
            : closeDialog()
        }
        title={
          dialogIsDisabled
            ? t("users.access.restore_title", "Atjaunot pieeju?")
            : t("users.access.disable_title", "Liegt pieeju?")
        }
        description={
          dialogUser ? (
            dialogIsDisabled ? (
              <>
                {t(
                  "users.access.restore_confirm_prefix",
                  "Vai tiešām vēlaties atjaunot lietotāja",
                )}{" "}
                <strong>{dialogUser.name}</strong>{" "}
                {t(
                  "users.access.restore_confirm_suffix",
                  "pieeju šim uzņēmumam?",
                )}
              </>
            ) : (
              <>
                {t(
                  "users.access.disable_confirm_prefix",
                  "Vai tiešām vēlaties liegt lietotājam",
                )}{" "}
                <strong>{dialogUser.name}</strong>{" "}
                {t(
                  "users.access.disable_confirm_suffix",
                  "pieeju šim uzņēmumam?",
                )}
              </>
            )
          ) : null
        }
        confirmLabel={
          dialogIsDisabled
            ? t("users.access.restore", "Atjaunot pieeju")
            : t("users.access.disable", "Liegt pieeju")
        }
        confirmVariant={dialogIsDisabled ? "default" : "danger"}
        onConfirm={confirmAccessChange}
        blocking={isPending}
      />

      <ConfirmModal
        open={pendingDialog?.type === "remove"}
        onOpenChange={(open) =>
          open && dialogUser
            ? setPendingDialog({ type: "remove", user: dialogUser })
            : closeDialog()
        }
        title={
          dialogIsCurrent
            ? t("users.remove.leave_title", "Pamest uzņēmumu?")
            : t("users.remove.user_title", "Noņemt lietotāju?")
        }
        description={
          dialogUser ? (
            dialogIsCurrent ? (
              t(
                "users.remove.leave_confirm",
                "Vai tiešām vēlaties pamest šo uzņēmumu?",
              )
            ) : (
              <>
                {t(
                  "users.remove.confirm_prefix",
                  "Vai tiešām vēlaties noņemt lietotāju",
                )}{" "}
                <strong>{dialogUser.name}</strong>{" "}
                {t("users.remove.confirm_suffix", "no šī uzņēmuma?")}
              </>
            )
          ) : null
        }
        confirmLabel={
          dialogIsCurrent
            ? t("users.remove.leave_company", "Pamest uzņēmumu")
            : t("actions.remove", "Noņemt")
        }
        confirmVariant="danger"
        onConfirm={confirmRemove}
        blocking={isPending}
      />
    </>
  );
}
