"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBuildingModuleAction } from "@/app/(protected)/modules/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ModuleFormModal } from "@/app/components/module-form-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";

export function ModuleCardActions({ module }: { module: BuildingModuleSummary }) {
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeleteOpenChange(open: boolean) {
    if (!open && !isPending) {
      setDeleteError(null);
    }
    setDeleteOpen(open);
  }

  function handleConfirmDelete() {
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteBuildingModuleAction(module.id);

      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }

      setDeleteOpen(false);
      showFeedback({ type: "success", text: "Modulis dzēsts." });
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-0.5">
        <IconActionButton
          label="Labot"
          icon="fas fa-pen"
          variant="edit"
          onClick={() => setEditOpen(true)}
        />
        <IconActionButton
          label="Dzēst"
          icon="fas fa-trash"
          variant="delete"
          onClick={() => setDeleteOpen(true)}
        />
      </div>

      <ModuleFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        module={module}
      />

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        title="Dzēst moduli?"
        description={
          <>
            <p>
              Vai tiešām vēlies dzēst moduli{" "}
              <span className="font-medium text-zinc-900">{module.name}</span>?
            </p>
            {deleteError ? (
              <p className="mt-2 text-red-600" role="alert">
                {deleteError}
              </p>
            ) : null}
          </>
        }
        confirmLabel={isPending ? "Dzēš…" : "Dzēst"}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        blocking={isPending}
      />
    </>
  );
}
