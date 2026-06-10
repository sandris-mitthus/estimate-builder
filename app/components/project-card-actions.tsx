"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProjectAction } from "@/app/(protected)/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ProjectFormModal } from "@/app/components/project-form-modal";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import { isIndividualProjectModuleDataComplete } from "@/app/lib/projects/project-module-data";
import type { ProjectSummary } from "@/app/lib/projects/types";

type ProjectCardActionsProps = {
  project: ProjectSummary;
  modules: BuildingModuleSummary[];
  moduleDataSpotlight?: boolean;
};

export function ProjectCardActions({
  project,
  modules,
  moduleDataSpotlight = false,
}: ProjectCardActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isIndividualProject = project.buildingModuleId === null;
  const moduleDataComplete = isIndividualProjectModuleDataComplete(project);

  function handleDeleteOpenChange(open: boolean) {
    if (!open && !isPending) {
      setDeleteError(null);
    }
    setDeleteOpen(open);
  }

  function handleConfirmDelete() {
    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteProjectAction(project.id);

      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }

      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-0.5">
        {isIndividualProject ? (
          <IconActionButton
            label={
              moduleDataComplete
                ? "Moduļa dati"
                : "Moduļa dati – trūkst vizualizāciju vai projekta failu"
            }
            icon="fas fa-level-up-alt"
            variant="moduleData"
            highlighted={!moduleDataComplete}
            spotlight={moduleDataSpotlight && !moduleDataComplete}
            onClick={() => router.push(`/${project.id}/module-data`)}
          />
        ) : null}
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
        <IconActionButton
          label="Apstiprināts"
          icon="fas fa-check"
          variant="approve"
          onClick={() => undefined}
        />
        <IconActionButton
          label="Noraidīts"
          icon="fas fa-times"
          variant="reject"
          onClick={() => undefined}
        />
      </div>

      <ProjectFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        project={project}
        modules={modules}
      />

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        title="Dzēst projektu?"
        description={
          <>
            <p>
              Vai tiešām vēlies dzēst projektu{" "}
              <span className="font-medium text-zinc-900">{project.name}</span>?
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
