"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteProjectAction,
  updateProjectStatusAction,
} from "@/app/(protected)/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { ProjectFormModal } from "@/app/components/project-form-modal";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import { isIndividualProjectModuleDataComplete } from "@/app/lib/projects/project-module-utils";
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
  const [copyOpen, setCopyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isIndividualProject = project.buildingModuleId === null;
  const moduleDataComplete = isIndividualProjectModuleDataComplete(project);
  const canEditOrDelete = project.status === "active";
  const canApprove = project.status === "active";
  const canReject = project.status === "active";
  const canComplete = project.status === "approved";
  const canCreate = useActionPermission("project.create");
  const canEdit = useActionPermission("project.edit");
  const canDelete = useActionPermission("project.delete");
  const canApproveAction = useActionPermission("project.approve");
  const canRejectAction = useActionPermission("project.reject");
  const canCompleteAction = useActionPermission("project.complete");
  const canManageModuleData = useActionPermission("project_module.manage");

  function handleDeleteOpenChange(open: boolean) {
    if (!open && !isPending) {
      setDeleteError(null);
    }
    setDeleteOpen(open);
  }

  function handleStatusOpenChange(open: boolean) {
    if (!open && !isPending) {
      setStatusError(null);
    }
    if (!open) {
      setApproveOpen(false);
      setRejectOpen(false);
      setCompleteOpen(false);
    }
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

  function handleConfirmApprove() {
    setStatusError(null);

    startTransition(async () => {
      const result = await updateProjectStatusAction(project.id, "approved");

      if (!result.ok) {
        setStatusError(result.error);
        return;
      }

      setApproveOpen(false);
      router.refresh();
    });
  }

  function handleConfirmReject() {
    setStatusError(null);

    startTransition(async () => {
      const result = await updateProjectStatusAction(project.id, "rejected");

      if (!result.ok) {
        setStatusError(result.error);
        return;
      }

      setRejectOpen(false);
      router.push("/");
      router.refresh();
    });
  }

  function handleConfirmComplete() {
    setStatusError(null);

    startTransition(async () => {
      const result = await updateProjectStatusAction(project.id, "completed");

      if (!result.ok) {
        setStatusError(result.error);
        return;
      }

      setCompleteOpen(false);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-0.5">
        {isIndividualProject && canManageModuleData ? (
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
        {canCreate ? (
          <IconActionButton
            label="Kopēt"
            icon="fas fa-copy"
            variant="copy"
            onClick={() => setCopyOpen(true)}
          />
        ) : null}
        {canEditOrDelete && canEdit ? (
          <>
            <IconActionButton
              label="Labot"
              icon="fas fa-pen"
              variant="edit"
              onClick={() => setEditOpen(true)}
            />
          </>
        ) : null}
        {canEditOrDelete && canDelete ? (
          <IconActionButton
            label="Dzēst"
            icon="fas fa-trash"
            variant="delete"
            onClick={() => setDeleteOpen(true)}
          />
        ) : null}
        {canApprove && canApproveAction ? (
          <IconActionButton
            label="Apstiprināts"
            icon="fas fa-check"
            variant="approve"
            onClick={() => setApproveOpen(true)}
          />
        ) : null}
        {canComplete && canCompleteAction ? (
          <IconActionButton
            label="Pabeigts"
            icon="fas fa-check-double"
            variant="complete"
            onClick={() => setCompleteOpen(true)}
          />
        ) : null}
        {canReject && canRejectAction ? (
          <IconActionButton
            label="Noraidīts"
            icon="fas fa-times"
            variant="reject"
            onClick={() => setRejectOpen(true)}
          />
        ) : null}
      </div>

      <ProjectFormModal
        open={copyOpen}
        onOpenChange={setCopyOpen}
        mode="create"
        modules={modules}
        copyFromProject={project}
      />

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

      <ConfirmModal
        open={approveOpen}
        onOpenChange={handleStatusOpenChange}
        title="Apstiprināt tāmi?"
        description={
          <>
            <p>
              Pēc apstiprināšanas tāmi vairs nevarēs labot un brīdinājumi par
              jauniem izcenojumiem pazudīs.
            </p>
            {statusError ? (
              <p className="mt-2 text-red-600" role="alert">
                {statusError}
              </p>
            ) : null}
          </>
        }
        confirmLabel={isPending ? "Apstiprina…" : "Apstiprināt"}
        onConfirm={handleConfirmApprove}
        blocking={isPending}
      />

      <ConfirmModal
        open={completeOpen}
        onOpenChange={handleStatusOpenChange}
        title="Atzīmēt projektu kā pabeigtu?"
        description={
          <>
            <p>
              Projekts pazudīs no saraksta, bet netiks dzēsts — vēlāk varēsi
              atvērt to tieši pēc saites.
            </p>
            {statusError ? (
              <p className="mt-2 text-red-600" role="alert">
                {statusError}
              </p>
            ) : null}
          </>
        }
        confirmLabel={isPending ? "Saglabā…" : "Pabeigts"}
        onConfirm={handleConfirmComplete}
        blocking={isPending}
      />

      <ConfirmModal
        open={rejectOpen}
        onOpenChange={handleStatusOpenChange}
        title="Noraidīt projektu?"
        description={
          <>
            <p>
              Projekts pazudīs no saraksta, bet netiks dzēsts no datubāzes.
            </p>
            {statusError ? (
              <p className="mt-2 text-red-600" role="alert">
                {statusError}
              </p>
            ) : null}
          </>
        }
        confirmLabel={isPending ? "Noraida…" : "Noraidīt"}
        confirmVariant="danger"
        onConfirm={handleConfirmReject}
        blocking={isPending}
      />
    </>
  );
}
