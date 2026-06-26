"use client";

import { useState } from "react";
import { WorkerFormModal } from "@/app/components/worker-form-modal";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useTranslations } from "@/app/components/translations-provider";

export function AddWorkerButton() {
  const canManage = useActionPermission("workers.manage");
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  if (!canManage) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        <i className="fas fa-plus text-xs" aria-hidden="true" />
        {t("workers.add", "Pievienot darbinieku")}
      </button>

      <WorkerFormModal open={open} onOpenChange={setOpen} />
    </>
  );
}
