"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAdditionalWorkEstimateAction } from "@/app/(protected)/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
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

export function ProjectAdditionalWorkSection({
  project,
  estimates,
  canManage,
}: ProjectAdditionalWorkSectionProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isCreating, setIsCreating] = useState(false);
  const editorLocked = isProjectEstimateLocked(project.status) || !canManage;

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
    router.push(`/${project.id}/additional-work/${result.id}`);
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
        {estimates.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {t(
              "additional_work.list.empty",
              "Vēl nav papildu darbu tāmes.",
            )}
          </p>
        ) : (
          estimates.map((estimate) => (
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
              <Link
                href={`/${project.id}/additional-work/${estimate.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                {t("additional_work.actions.open", "Atvērt")}
                <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
