"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteExcludedPositionAction } from "@/app/(protected)/excluded-positions/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { EditExcludedPositionModal } from "@/app/components/edit-excluded-position-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";

type ExcludedPositionRowActionsProps = {
  position: ExcludedPosition;
};

export function ExcludedPositionRowActions({ position }: ExcludedPositionRowActionsProps) {
  const router = useRouter();
  const canManage = useActionPermission("excluded_positions.manage");
  const { showFeedback } = useFeedbackToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirmDelete() {
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteExcludedPositionAction(position.id);

      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }

      setDeleteOpen(false);
      showFeedback({ type: "success", text: "Pozīcija dzēsta." });
      router.refresh();
    });
  }

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
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

      <EditExcludedPositionModal
        key={position.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        position={position}
        blocking={isPending}
      />

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Dzēst pozīciju?"
        description={
          <>
            <p>
              Vai tiešām vēlies dzēst pozīciju{" "}
              <span className="font-medium text-zinc-900">{position.name}</span>?
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
