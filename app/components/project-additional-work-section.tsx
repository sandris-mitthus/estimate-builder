"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createAdditionalWorkEstimateAction,
  deleteAdditionalWorkEstimateAction,
} from "@/app/(protected)/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import {
  isPlainPrimaryNavigationClick,
  NavigationLoadingProvider,
  useNavigationLoading,
} from "@/app/components/navigation-loading-context";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import type { AdditionalWorkEstimateSummary } from "@/app/lib/projects/types";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { isProjectEstimateLocked } from "@/app/lib/projects/project-status";
import type { ProjectSummary } from "@/app/lib/projects/types";

type ProjectAdditionalWorkSectionProps = {
  project: ProjectSummary;
  estimates: AdditionalWorkEstimateSummary[];
  canManage: boolean;
};

export function ProjectAdditionalWorkSection(
  props: ProjectAdditionalWorkSectionProps,
) {
  return (
    <NavigationLoadingProvider>
      <ProjectAdditionalWorkSectionContent {...props} />
    </NavigationLoadingProvider>
  );
}

function ProjectAdditionalWorkSectionContent({
  project,
  estimates,
  canManage,
}: ProjectAdditionalWorkSectionProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const { beginNavigation } = useNavigationLoading();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [visibleEstimates, setVisibleEstimates] = useState(estimates);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<AdditionalWorkEstimateSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const editorLocked = isProjectEstimateLocked(project.status) || !canManage;
  const loadingMessage = t(
    "additional_work.loading",
    "Ielādē papildu darbu tāmi…",
  );

  useEffect(() => {
    setVisibleEstimates(estimates);
  }, [estimates]);

  function openEstimate(estimateId: string) {
    const href = `/${project.id}/additional-work/${estimateId}`;
    beginNavigation(href, loadingMessage);
    router.push(href);
  }

  async function handleCreate() {
    if (editorLocked || isCreating) return;

    setIsCreating(true);
    clearFeedback();

    const result = await createAdditionalWorkEstimateAction(project.id);
    setIsCreating(false);

    if (!result.ok) {
      showFeedback({ type: "error", text: translateActionError(t, result) });
      return;
    }

    showFeedback({
      type: "success",
      text: t(
        "additional_work.feedback.created",
        "Papildu darbu tāme izveidota.",
      ),
    });
    openEstimate(result.id);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || isDeleting) return;

    const target = deleteTarget;
    const previousEstimates = visibleEstimates;

    setIsDeleting(true);
    clearFeedback();
    setDeleteTarget(null);
    setVisibleEstimates((current) =>
      current.filter((estimate) => estimate.id !== target.id),
    );

    const result = await deleteAdditionalWorkEstimateAction(
      project.id,
      target.id,
    );
    setIsDeleting(false);

    if (!result.ok) {
      setVisibleEstimates(previousEstimates);
      showFeedback({ type: "error", text: translateActionError(t, result) });
      return;
    }

    showFeedback({
      type: "success",
      text: t(
        "additional_work.feedback.deleted",
        "Papildu darbu tāme dzēsta.",
      ),
    });
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-zinc-900">
            {t("additional_work.section.title", "Papildu darbu tāmes")}
          </h2>
          <p className="text-sm text-zinc-500">
            {t(
              "additional_work.section.description",
              "Darbi, kas radušies procesā un nav iekļauti līguma tāmē.",
            )}
          </p>
        </div>

        {!editorLocked ? (
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isCreating}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCreating ? (
              <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
            ) : (
              <i className="fas fa-plus text-xs" aria-hidden="true" />
            )}
            {t(
              "additional_work.actions.create",
              "Izveidot papildu darbu tāmi",
            )}
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {visibleEstimates.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {t(
              "additional_work.list.empty",
              "Vēl nav papildu darbu tāmes.",
            )}
          </p>
        ) : (
          visibleEstimates.map((estimate) => {
            const href = `/${project.id}/additional-work/${estimate.id}`;

            return (
              <div
                key={estimate.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{estimate.title}</p>
                  {estimate.meta.savedAt || estimate.updatedAt ? (
                    <p className="text-xs text-zinc-500">
                      {estimate.meta.savedAt
                        ? t("common.saved_at", "Saglabāts: {date}", {
                            date: formatDisplayDateDdMmYy(estimate.meta.savedAt),
                          })
                        : estimate.updatedAt
                          ? formatDisplayDateDdMmYy(estimate.updatedAt)
                          : null}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={href}
                    onClick={(event) => {
                      if (!isPlainPrimaryNavigationClick(event)) {
                        return;
                      }

                      beginNavigation(href, loadingMessage);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    {t("additional_work.actions.open", "Atvērt")}
                    <i
                      className="fas fa-arrow-right text-xs"
                      aria-hidden="true"
                    />
                  </Link>
                  {!editorLocked ? (
                    <IconActionButton
                      label={t("actions.delete", "Dzēst")}
                      icon="fas fa-trash"
                      variant="delete"
                      onClick={() => setDeleteTarget(estimate)}
                    />
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
        title={t(
          "additional_work.delete.title",
          "Dzēst papildu darbu tāmi?",
        )}
        description={
          <>
            <p>
              {t(
                "additional_work.delete.description",
                "Tāme tiks neatgriezeniski dzēsta.",
              )}
            </p>
            {deleteTarget ? (
              <p className="mt-2 font-medium text-zinc-900">
                {deleteTarget.title}
              </p>
            ) : null}
          </>
        }
        confirmLabel={
          isDeleting
            ? t("actions.deleting", "Dzēš…")
            : t("actions.delete", "Dzēst")
        }
        confirmVariant="danger"
        onConfirm={() => void handleConfirmDelete()}
        blocking={isDeleting}
      />
    </section>
  );
}
