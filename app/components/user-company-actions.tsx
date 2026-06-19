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
        showFeedback({ type: "error", text: result.error });
        return;
      }

      showFeedback({
        type: "success",
        text: isDisabled ? "Lietotāja pieeja atjaunota." : "Lietotāja pieeja liegta.",
      });
      setPendingDialog(null);
      router.refresh();
    });
  }

  function confirmRemove() {
    startTransition(async () => {
      const result = await removeCompanyUserAction(userId);
      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        return;
      }

      showFeedback({
        type: "success",
        text: isCurrentUser
          ? "Jūs pametāt uzņēmumu."
          : "Lietotājs noņemts no uzņēmuma.",
      });
      setPendingDialog(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {canManageCompanyAccess && !isCurrentUser ? (
          <Tooltip label={isDisabled ? "Atjaunot pieeju" : "Liegt pieeju"}>
            <button
              type="button"
              onClick={() => setPendingDialog("access")}
              disabled={isPending}
              aria-label={isDisabled ? "Atjaunot pieeju" : "Liegt pieeju"}
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
            label={isCurrentUser ? "Pamest uzņēmumu" : "Noņemt no uzņēmuma"}
          >
            <button
              type="button"
              onClick={() => setPendingDialog("remove")}
              disabled={isPending}
              aria-label={isCurrentUser ? "Pamest uzņēmumu" : "Noņemt no uzņēmuma"}
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
        title={isDisabled ? "Atjaunot pieeju?" : "Liegt pieeju?"}
        description={
          isDisabled ? (
            <>
              Vai tiešām vēlaties atjaunot lietotāja{" "}
              <strong>{userName}</strong> pieeju šim uzņēmumam?
            </>
          ) : (
            <>
              Vai tiešām vēlaties liegt lietotājam <strong>{userName}</strong>{" "}
              pieeju šim uzņēmumam?
            </>
          )
        }
        confirmLabel={isDisabled ? "Atjaunot pieeju" : "Liegt pieeju"}
        confirmVariant={isDisabled ? "default" : "danger"}
        onConfirm={confirmAccessChange}
        blocking={isPending}
      />

      <ConfirmModal
        open={pendingDialog === "remove"}
        onOpenChange={(open) => (open ? setPendingDialog("remove") : closeDialog())}
        title={isCurrentUser ? "Pamest uzņēmumu?" : "Noņemt lietotāju?"}
        description={
          isCurrentUser ? (
            "Vai tiešām vēlaties pamest šo uzņēmumu?"
          ) : (
            <>
              Vai tiešām vēlaties noņemt lietotāju <strong>{userName}</strong>{" "}
              no šī uzņēmuma?
            </>
          )
        }
        confirmLabel={isCurrentUser ? "Pamest uzņēmumu" : "Noņemt"}
        confirmVariant="danger"
        onConfirm={confirmRemove}
        blocking={isPending}
      />
    </>
  );
}
