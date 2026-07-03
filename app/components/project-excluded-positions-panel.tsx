"use client";

import { useMemo, useState, useTransition } from "react";
import {
  omitProjectExcludedPositionAction,
  restoreProjectExcludedPositionAction,
} from "@/app/(protected)/actions";
import { IconActionButton } from "@/app/components/icon-action-button";
import { RestoreButton } from "@/app/components/restore-button";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  countOmittedExcludedPositions,
  normalizeExcludedPositionOmissions,
} from "@/app/lib/excluded-positions/resolve-project-excluded-positions";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";

type ProjectExcludedPositionsPanelProps = {
  projectId: string;
  globalPositions: ExcludedPosition[];
  omittedIds: string[];
  readOnly?: boolean;
  onOmit: (omittedIds: string[]) => void;
};

type ListEntry = {
  position: ExcludedPosition;
  displayNumber: number | null;
  omitted: boolean;
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
  const [showHiddenOmitted, setShowHiddenOmitted] = useState(false);

  const omittedSet = useMemo(
    () => new Set(normalizeExcludedPositionOmissions(omittedIds)),
    [omittedIds],
  );

  const omittedCount = useMemo(
    () => countOmittedExcludedPositions(globalPositions, omittedIds),
    [globalPositions, omittedIds],
  );

  const listEntries = useMemo((): ListEntry[] => {
    let activeNumber = 0;
    const entries: ListEntry[] = [];

    for (const position of globalPositions) {
      const omitted = omittedSet.has(position.id);
      if (omitted && !showHiddenOmitted) {
        continue;
      }

      entries.push({
        position,
        displayNumber: omitted ? null : ++activeNumber,
        omitted,
      });
    }

    return entries;
  }, [globalPositions, omittedSet, showHiddenOmitted]);

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

  function handleRestore(position: ExcludedPosition) {
    if (readOnly || isPending) return;

    clearFeedback();
    startTransition(async () => {
      const result = await restoreProjectExcludedPositionAction(
        projectId,
        position.id,
      );

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      onOmit(result.omittedIds);
      showFeedback({
        type: "success",
        text: t(
          "excluded_positions.feedback.restored_to_project",
          "Pozīcija atjaunota šī projekta piedāvājumā.",
        ),
      });
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="min-w-0">
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
        {omittedCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowHiddenOmitted((current) => !current)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              showHiddenOmitted
                ? "border-zinc-400 bg-zinc-200 text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <i
              className={`fas ${showHiddenOmitted ? "fa-eye-slash" : "fa-eye"} text-[10px]`}
              aria-hidden="true"
            />
            {showHiddenOmitted
              ? t("estimate.hidden.hide", "Paslēpt noņemtās")
              : t("estimate.hidden.show", "Rādīt noņemtās ({count})", {
                  count: omittedCount,
                })}
          </button>
        ) : null}
      </div>

      {listEntries.length === 0 ? (
        <p className="px-4 py-3 text-sm text-zinc-500">
          {t(
            "excluded_positions.project.all_omitted",
            "Visas globālās neiekļautās pozīcijas ir izņemtas no šī projekta piedāvājuma.",
          )}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {listEntries.map(({ position, displayNumber, omitted }) => (
            <li
              key={position.id}
              className={`flex items-center gap-3 px-4 py-2.5 ${
                omitted ? "bg-zinc-100/90" : ""
              }`}
            >
              <span
                className={`w-6 shrink-0 text-sm tabular-nums ${
                  omitted ? "text-zinc-400" : "text-zinc-400"
                }`}
              >
                {displayNumber != null ? `${displayNumber}.` : ""}
              </span>
              <p
                className={`min-w-0 flex-1 text-sm ${
                  omitted ? "text-zinc-400" : "text-zinc-800"
                }`}
              >
                {position.name}
              </p>
              {!readOnly ? (
                omitted ? (
                  <RestoreButton
                    label={t("estimate.hidden.restore", "Atjaunot pozīciju")}
                    onClick={() => handleRestore(position)}
                    className={isPending ? "pointer-events-none opacity-50" : ""}
                  />
                ) : (
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
                )
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
