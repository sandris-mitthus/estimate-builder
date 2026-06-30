"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteToolAction } from "@/app/(protected)/tools/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ToolAssignWorkerModal } from "@/app/components/tool-assign-worker-modal";
import { ToolFormModal } from "@/app/components/tool-form-modal";
import { ToolHistoryModal } from "@/app/components/tool-history-modal";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { ToolSummary } from "@/app/lib/tools/types";
import type { WorkerSummary } from "@/app/lib/workers/types";

type ToolRowActionsProps = {
  tool: ToolSummary;
  workers: WorkerSummary[];
  workersModuleEnabled: boolean;
  onToolUpdated: (tool: ToolSummary) => void;
};

export function ToolRowActions({
  tool,
  workers,
  workersModuleEnabled,
  onToolUpdated,
}: ToolRowActionsProps) {
  const router = useRouter();
  const canManage = useActionPermission("tools.manage");
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [editOpen, setEditOpen] = useState(false);
  const [assignWorkerOpen, setAssignWorkerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirmDelete() {
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteToolAction(tool.id);

      if (!result.ok) {
        setDeleteError(translateActionError(t, result));
        return;
      }

      setDeleteOpen(false);
      showFeedback({
        type: "success",
        text: t("tools.feedback.deleted", "Instruments dzēsts."),
      });
      router.refresh();
    });
  }

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
        {workersModuleEnabled ? (
          <>
            <IconActionButton
              label={t("tools.actions.assign_worker", "Piesaistīt darbiniekam")}
              icon="fas fa-user-plus"
              variant="assign"
              onClick={() => setAssignWorkerOpen(true)}
            />
            <IconActionButton
              label={t("tools.actions.history", "Instrumenta vēsture")}
              icon="fas fa-history"
              variant="history"
              onClick={() => setHistoryOpen(true)}
            />
          </>
        ) : null}
        <IconActionButton
          label={t("tools.actions.edit", "Labot instrumentu")}
          icon="fas fa-pen"
          variant="edit"
          onClick={() => setEditOpen(true)}
        />
        <IconActionButton
          label={t("tools.actions.delete", "Dzēst instrumentu")}
          icon="fas fa-trash"
          variant="delete"
          onClick={() => setDeleteOpen(true)}
        />
      </div>

      <ToolFormModal
        key={tool.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        tool={tool}
        workers={workers}
      />

      {workersModuleEnabled ? (
        <>
          <ToolAssignWorkerModal
            key={`${tool.id}:assign`}
            open={assignWorkerOpen}
            onOpenChange={setAssignWorkerOpen}
            tool={tool}
            workers={workers}
            onToolUpdated={onToolUpdated}
          />

          <ToolHistoryModal
            key={`${tool.id}:history`}
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            tool={tool}
          />
        </>
      ) : null}

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("tools.delete.title", "Dzēst instrumentu?")}
        description={
          <>
            <p>
              {t("tools.delete.description", "Instruments tiks dzēsts no saraksta.")}
            </p>
            <p className="mt-2 font-medium text-zinc-900">
              {tool.toolNumber} — {tool.name}
            </p>
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
