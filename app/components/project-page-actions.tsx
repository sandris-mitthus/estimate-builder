"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { ProjectFormModal } from "@/app/components/project-form-modal";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";

type ProjectPageActionsProps = {
  modules: BuildingModuleSummary[];
  archive?: boolean;
};

export function ProjectPageActions({
  modules,
  archive = false,
}: ProjectPageActionsProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = useActionPermission("project.create");

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canCreate ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            Jauns projekts
          </button>
        ) : null}

        <Link
          href={archive ? "/" : "/?archive=1"}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
            archive
              ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          <i className="fas fa-archive text-xs" aria-hidden="true" />
          Arhīvs
        </Link>
      </div>

      <ProjectFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        modules={modules}
      />
    </>
  );
}
