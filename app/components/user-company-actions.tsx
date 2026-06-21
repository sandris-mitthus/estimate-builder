"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  removeCompanyUserAction,
  setCompanyUserAccessAction,
} from "@/app/(protected)/users/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { UserSummary } from "@/app/lib/users/types";

type UserCompanyActionsProps = {
  userId: string;
  userName: string;
  status: UserSummary["companyStatus"];
  canManageCompanyAccess: boolean;
  isCurrentUser: boolean;
};

type PendingDialog = "access" | "remove" | null;

const actionButtonClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60";

export function UserCompanyActions({
  userId,
  userName,
  status,
  canManageCompanyAccess,
  isCurrentUser,
}: UserCompanyActionsProps) {
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [pendingDialog, setPendingDialog] = useState<PendingDialog>(null);
  const [isPending, startTransition] = useTransition();

  const isDisabled = status === "disabled";
  const canRemove = canManageCompanyAccess || isCurrentUser;

  function closeDialog() {
    if (!isPending) {
      setPendingDialog(null);
    }
  }

  function confirmAccessChange() {
    const nextStatus = isDisabled ? "active" : "disabled";

    startTransition(async () => {
      const result = await setCompanyUserAccessAction(userId, nextStatus);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: isDisabled
          ? t("users.access.feedback.restored", "Lietotāja pieeja atjaunota.")
          : t("users.access.feedback.disabled", "Lietotāja pieeja liegta."),
      });
      setPendingDialog(null);
      router.refresh();
    });
  }

  function confirmRemove() {
    startTransition(async () => {
      const result = await removeCompanyUserAction(userId);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: isCurrentUser
          ? t("users.remove.feedback.left_company", "Jūs pametāt uzņēmumu.")
          : t("users.remove.feedback.removed", "Lietotājs noņemts no uzņēmuma."),
      });
      setPendingDialog(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {canManageCompanyAccess && !isCurrentUser ? (
          <Tooltip
            label={
              isDisabled
                ? t("users.access.restore", "Atjaunot pieeju")
                : t("users.access.disable", "Liegt pieeju")
            }
          >
            <button
              type="button"
              onClick={() => setPendingDialog("access")}
              disabled={isPending}
              aria-label={
                isDisabled
                  ? t("users.access.restore", "Atjaunot pieeju")
                  : t("users.access.disable", "Liegt pieeju")
              }
              className={actionButtonClassName}
            >
              <i
                className={`fas ${isDisabled ? "fa-lock" : "fa-lock-open"} text-sm`}
                aria-hidden="true"
              />
            </button>
          </Tooltip>
        ) : null}

        {canRemove ? (
          <Tooltip
            label={
              isCurrentUser
                ? t("users.remove.leave_company", "Pamest uzņēmumu")
                : t("users.remove.from_company", "Noņemt no uzņēmuma")
            }
          >
            <button
              type="button"
              onClick={() => setPendingDialog("remove")}
              disabled={isPending}
              aria-label={
                isCurrentUser
                  ? t("users.remove.leave_company", "Pamest uzņēmumu")
                  : t("users.remove.from_company", "Noņemt no uzņēmuma")
              }
              className={`${actionButtonClassName} hover:bg-red-50 hover:text-red-600`}
            >
              <i className="fas fa-times text-sm" aria-hidden="true" />
            </button>
          </Tooltip>
        ) : null}
      </div>

      <ConfirmModal
        open={pendingDialog === "access"}
        onOpenChange={(open) => (open ? setPendingDialog("access") : closeDialog())}
        title={
          isDisabled
            ? t("users.access.restore_title", "Atjaunot pieeju?")
            : t("users.access.disable_title", "Liegt pieeju?")
        }
        description={
          isDisabled ? (
            <>
              {t("users.access.restore_confirm_prefix", "Vai tiešām vēlaties atjaunot lietotāja")}{" "}
              <strong>{userName}</strong>{" "}
              {t("users.access.restore_confirm_suffix", "pieeju šim uzņēmumam?")}
            </>
          ) : (
            <>
              {t("users.access.disable_confirm_prefix", "Vai tiešām vēlaties liegt lietotājam")}{" "}
              <strong>{userName}</strong>{" "}
              {t("users.access.disable_confirm_suffix", "pieeju šim uzņēmumam?")}
            </>
          )
        }
        confirmLabel={
          isDisabled
            ? t("users.access.restore", "Atjaunot pieeju")
            : t("users.access.disable", "Liegt pieeju")
        }
        confirmVariant={isDisabled ? "default" : "danger"}
        onConfirm={confirmAccessChange}
        blocking={isPending}
      />

      <ConfirmModal
        open={pendingDialog === "remove"}
        onOpenChange={(open) => (open ? setPendingDialog("remove") : closeDialog())}
        title={
          isCurrentUser
            ? t("users.remove.leave_title", "Pamest uzņēmumu?")
            : t("users.remove.user_title", "Noņemt lietotāju?")
        }
        description={
          isCurrentUser ? (
            t("users.remove.leave_confirm", "Vai tiešām vēlaties pamest šo uzņēmumu?")
          ) : (
            <>
              {t("users.remove.confirm_prefix", "Vai tiešām vēlaties noņemt lietotāju")}{" "}
              <strong>{userName}</strong>{" "}
              {t("users.remove.confirm_suffix", "no šī uzņēmuma?")}
            </>
          )
        }
        confirmLabel={
          isCurrentUser
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
