"use client";

import { useMemo, useTransition } from "react";
import { omitProjectExcludedPositionAction } from "@/app/(protected)/actions";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { resolveProjectExcludedPositions } from "@/app/lib/excluded-positions/resolve-project-excluded-positions";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";

type ProjectExcludedPositionsPanelProps = {
  projectId: string;
  globalPositions: ExcludedPosition[];
  omittedIds: string[];
  readOnly?: boolean;
  onOmit: (omittedIds: string[]) => void;
};

export function ProjectExcludedPositionsPanel({
  projectId,
  globalPositions,
  omittedIds,
  readOnly = false,
  onOmit,
}: ProjectExcludedPositionsPanelProps) {
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [isPending, startTransition] = useTransition();

  const visiblePositions = useMemo(
    () => resolveProjectExcludedPositions(globalPositions, omittedIds),
    [globalPositions, omittedIds],
  );

  if (globalPositions.length === 0) {
    return null;
  }

  function handleOmit(position: ExcludedPosition) {
    if (readOnly || isPending) return;

    clearFeedback();
    startTransition(async () => {
      const result = await omitProjectExcludedPositionAction(projectId, position.id);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      onOmit(result.omittedIds);
      showFeedback({
        type: "success",
        text: t(
          "excluded_positions.feedback.omitted_from_project",
          "Pozīcija noņemta no šī projekta piedāvājuma.",
        ),
      });
    });
  }

  if (visiblePositions.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
        <p className="text-sm font-medium text-zinc-700">
          {t("nav.excluded_positions", "Neiekļautās pozīcijas")}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {t(
            "excluded_positions.project.all_omitted",
            "Visas globālās neiekļautās pozīcijas ir izņemtas no šī projekta piedāvājuma.",
          )}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <p className="text-sm font-medium text-zinc-900">
          {t("nav.excluded_positions", "Neiekļautās pozīcijas")}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {t(
            "excluded_positions.project.description",
            "Rādītas piedāvājumā; noņemšana attiecas tikai uz šo projektu.",
          )}
        </p>
      </div>
      <ul className="divide-y divide-zinc-100">
        {visiblePositions.map((position, index) => (
          <li
            key={position.id}
            className="flex items-center gap-3 px-4 py-2.5"
          >
            <span className="w-6 shrink-0 text-sm tabular-nums text-zinc-400">
              {index + 1}.
            </span>
            <p className="min-w-0 flex-1 text-sm text-zinc-800">{position.name}</p>
            {!readOnly ? (
              <IconActionButton
                label={t(
                  "excluded_positions.project.omit_action",
                  "Noņemt no šī projekta piedāvājuma",
                )}
                icon="fas fa-times"
                variant="delete"
                tooltipAlign="end"
                onClick={() => handleOmit(position)}
                className={isPending ? "pointer-events-none opacity-50" : ""}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
