"use client";

import { useState } from "react";
import { ToolFormModal } from "@/app/components/tool-form-modal";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useTranslations } from "@/app/components/translations-provider";
import type { WorkerSummary } from "@/app/lib/workers/types";

type AddToolButtonProps = {
  workers: WorkerSummary[];
};

export function AddToolButton({ workers }: AddToolButtonProps) {
  const canManage = useActionPermission("tools.manage");
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
        {t("tools.add", "Pievienot instrumentu")}
      </button>

      <ToolFormModal open={open} onOpenChange={setOpen} workers={workers} />
    </>
  );
}
