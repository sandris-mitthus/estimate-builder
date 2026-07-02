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
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
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
  const canEditProject = project.status === "active";
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
  const { t } = useTranslations();

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
        setDeleteError(translateActionError(t, result));
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
        setStatusError(translateActionError(t, result));
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
        setStatusError(translateActionError(t, result));
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
        setStatusError(translateActionError(t, result));
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
                ? t("projects.module_data.action", "Moduļa dati")
                : t(
                    "projects.module_data.missing_action",
                    "Moduļa dati – trūkst vizualizāciju vai projekta failu",
                  )
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
            label={t("actions.copy", "Kopēt")}
            icon="fas fa-copy"
            variant="copy"
            onClick={() => setCopyOpen(true)}
          />
        ) : null}
        {canEditProject && canEdit ? (
          <>
            <IconActionButton
              label={t("actions.edit", "Labot")}
              icon="fas fa-pen"
              variant="edit"
              onClick={() => setEditOpen(true)}
            />
          </>
        ) : null}
        {canDelete ? (
          <IconActionButton
            label={t("actions.delete", "Dzēst")}
            icon="fas fa-trash"
            variant="delete"
            onClick={() => setDeleteOpen(true)}
          />
        ) : null}
        {canApprove && canApproveAction ? (
          <IconActionButton
            label={t("actions.approve", "Apstiprināt")}
            icon="fas fa-check"
            variant="approve"
            onClick={() => setApproveOpen(true)}
          />
        ) : null}
        {canComplete && canCompleteAction ? (
          <IconActionButton
            label={t("actions.complete", "Pabeigts")}
            icon="fas fa-check-double"
            variant="complete"
            onClick={() => setCompleteOpen(true)}
          />
        ) : null}
        {canReject && canRejectAction ? (
          <IconActionButton
            label={t("actions.reject", "Noraidīt")}
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
        title={t("projects.delete.title", "Dzēst projektu?")}
        description={
          <>
            <p>
              {t("projects.delete.confirm_prefix", "Vai tiešām vēlies dzēst projektu")}{" "}
              <span className="font-medium text-zinc-900">{project.name}</span>?
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

      <ConfirmModal
        open={approveOpen}
        onOpenChange={handleStatusOpenChange}
        title={t("projects.approve.title", "Apstiprināt tāmi?")}
        description={
          <>
            <p>
              {t(
                "projects.approve.description",
                "Pēc apstiprināšanas tāmi vairs nevarēs labot un brīdinājumi par jauniem izcenojumiem pazudīs.",
              )}
            </p>
            {statusError ? (
              <p className="mt-2 text-red-600" role="alert">
                {statusError}
              </p>
            ) : null}
          </>
        }
        confirmLabel={
          isPending
            ? t("actions.approving", "Apstiprina…")
            : t("actions.approve", "Apstiprināt")
        }
        onConfirm={handleConfirmApprove}
        blocking={isPending}
      />

      <ConfirmModal
        open={completeOpen}
        onOpenChange={handleStatusOpenChange}
        title={t("projects.complete.title", "Atzīmēt projektu kā pabeigtu?")}
        description={
          <>
            <p>
              {t(
                "projects.complete.description",
                "Projekts pazudīs no saraksta, bet netiks dzēsts — vēlāk varēsi atvērt to tieši pēc saites.",
              )}
            </p>
            {statusError ? (
              <p className="mt-2 text-red-600" role="alert">
                {statusError}
              </p>
            ) : null}
          </>
        }
        confirmLabel={
          isPending ? t("actions.saving", "Saglabā…") : t("actions.complete", "Pabeigts")
        }
        onConfirm={handleConfirmComplete}
        blocking={isPending}
      />

      <ConfirmModal
        open={rejectOpen}
        onOpenChange={handleStatusOpenChange}
        title={t("projects.reject.title", "Noraidīt projektu?")}
        description={
          <>
            <p>
              {t(
                "projects.reject.description",
                "Projekts pazudīs no saraksta, bet netiks dzēsts no datubāzes.",
              )}
            </p>
            {statusError ? (
              <p className="mt-2 text-red-600" role="alert">
                {statusError}
              </p>
            ) : null}
          </>
        }
        confirmLabel={
          isPending
            ? t("actions.rejecting", "Noraida…")
            : t("actions.reject", "Noraidīt")
        }
        confirmVariant="danger"
        onConfirm={handleConfirmReject}
        blocking={isPending}
      />
    </>
  );
}
