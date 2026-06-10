"use client";

import { useState } from "react";
import { ProjectFormModal } from "@/app/components/project-form-modal";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";

type AddProjectButtonProps = {
  modules: BuildingModuleSummary[];
};

export function AddProjectButton({ modules }: AddProjectButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        <i className="fas fa-plus text-xs" aria-hidden="true" />
        Jauns projekts
      </button>

      <ProjectFormModal
        open={open}
        onOpenChange={setOpen}
        mode="create"
        modules={modules}
      />
    </>
  );
}
