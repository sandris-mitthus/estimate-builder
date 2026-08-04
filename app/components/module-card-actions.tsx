"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBuildingModuleAction } from "@/app/(protected)/modules/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { ModuleCopyModal } from "@/app/components/module-copy-modal";
import { ModuleFormModal } from "@/app/components/module-form-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";

export function ModuleCardActions({ module }: { module: BuildingModuleSummary }) {
  const router = useRouter();
  const canManage = useActionPermission("modules.manage");
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [copyOpen, setCopyOpen] = useState(false);
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
        setDeleteError(translateActionError(t, result));
        return;
      }

      setDeleteOpen(false);
      showFeedback({
        type: "success",
        text: t("modules.feedback.deleted", "Modulis dzēsts."),
      });
      router.refresh();
    });
  }

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-0.5">
        <IconActionButton
          label={t("actions.copy", "Kopēt")}
          icon="fas fa-copy"
          variant="copy"
          onClick={() => setCopyOpen(true)}
        />
        <IconActionButton
          label={t("actions.edit", "Labot")}
          icon="fas fa-pen"
          variant="edit"
          onClick={() => setEditOpen(true)}
        />
        <IconActionButton
          label={t("actions.delete", "Dzēst")}
          icon="fas fa-trash"
          variant="delete"
          onClick={() => setDeleteOpen(true)}
        />
      </div>

      <ModuleCopyModal
        open={copyOpen}
        onOpenChange={setCopyOpen}
        module={module}
      />

      <ModuleFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        module={module}
      />

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        title={t("modules.delete.title", "Dzēst moduli?")}
        description={
          <>
            <p>
              {t("modules.delete.confirm_prefix", "Vai tiešām vēlies dzēst moduli")}{" "}
              <span className="font-medium text-zinc-900">{module.name}</span>?
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
