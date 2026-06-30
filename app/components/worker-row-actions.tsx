"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteWorkerAction } from "@/app/(protected)/workers/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { WorkerFormModal } from "@/app/components/worker-form-modal";
import { WorkerToolsModal } from "@/app/components/worker-tools-modal";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { ToolSummary } from "@/app/lib/tools/types";
import type { WorkerSummary } from "@/app/lib/workers/types";
import { formatWorkerName } from "@/app/lib/workers/types";

type WorkerRowActionsProps = {
  worker: WorkerSummary;
  assignedTools: ToolSummary[];
  toolsModuleEnabled: boolean;
};

export function WorkerRowActions({
  worker,
  assignedTools,
  toolsModuleEnabled,
}: WorkerRowActionsProps) {
  const router = useRouter();
  const canManage = useActionPermission("workers.manage");
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirmDelete() {
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteWorkerAction(worker.id);

      if (!result.ok) {
        setDeleteError(translateActionError(t, result));
        return;
      }

      setDeleteOpen(false);
      showFeedback({
        type: "success",
        text: t("workers.feedback.deleted", "Darbinieks dzēsts."),
      });
      router.refresh();
    });
  }

  if (!canManage && !toolsModuleEnabled) {
    return null;
  }

  const fullName = formatWorkerName(worker);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
        {toolsModuleEnabled ? (
          <IconActionButton
            label={t("workers.actions.tools", "Piesaistītie instrumenti")}
            icon="fas fa-tools"
            variant="tools"
            onClick={() => setToolsOpen(true)}
          />
        ) : null}
        {canManage ? (
          <>
            <IconActionButton
              label={t("workers.actions.edit", "Labot darbinieku")}
              icon="fas fa-pen"
              variant="edit"
              onClick={() => setEditOpen(true)}
            />
            <IconActionButton
              label={t("workers.actions.delete", "Dzēst darbinieku")}
              icon="fas fa-trash"
              variant="delete"
              onClick={() => setDeleteOpen(true)}
            />
          </>
        ) : null}
      </div>

      <WorkerToolsModal
        open={toolsOpen}
        onOpenChange={setToolsOpen}
        worker={worker}
        tools={assignedTools}
      />

      <WorkerFormModal
        key={worker.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        worker={worker}
      />

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("workers.delete.title", "Dzēst darbinieku?")}
        description={
          <>
            <p>
              {t("workers.delete.description", "Darbinieks tiks dzēsts no saraksta.")}
            </p>
            <p className="mt-2 font-medium text-zinc-900">{fullName}</p>
            {deleteError ? (
              <p className="mt-2 text-red-600" role="alert">
                {deleteError}
              </p>
            ) : null}
          </>
        }
        confirmLabel={
          isPending ? t("actions.deleting", "Dzēš…") : t("actions.delete", "Dzēst")
        }
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        blocking={isPending}
      />
    </>
  );
}
