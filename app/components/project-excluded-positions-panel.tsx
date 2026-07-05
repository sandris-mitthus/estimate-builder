"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import {
  createExcludedPositionFromProjectAction,
  omitProjectExcludedPositionAction,
  reorderExcludedPositionsFromProjectAction,
  restoreProjectExcludedPositionAction,
} from "@/app/(protected)/actions";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { RestoreButton } from "@/app/components/restore-button";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { mergeExcludedPositionVisibleReorder } from "@/app/lib/excluded-positions/merge-visible-reorder";
import {
  countOmittedExcludedPositions,
  normalizeExcludedPositionOmissions,
} from "@/app/lib/excluded-positions/resolve-project-excluded-positions";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { translateActionError } from "@/app/lib/i18n/action-errors";

type ProjectExcludedPositionsPanelProps = {
  projectId: string;
  globalPositions: ExcludedPosition[];
  omittedIds: string[];
  readOnly?: boolean;
  canManage?: boolean;
  onOmit: (omittedIds: string[]) => void;
  onPositionsChange: (positions: ExcludedPosition[]) => void;
};

type ListEntry = {
  position: ExcludedPosition;
  displayNumber: number | null;
  omitted: boolean;
};

function SortableProjectExcludedRow({
  entry,
  readOnly,
  canReorder,
  dragLabel,
  isPending,
  onOmit,
  onRestore,
}: {
  entry: ListEntry;
  readOnly: boolean;
  canReorder: boolean;
  dragLabel: string;
  isPending: boolean;
  onOmit: (position: ExcludedPosition) => void;
  onRestore: (position: ExcludedPosition) => void;
}) {
  const { t } = useTranslations();
  const { position, displayNumber, omitted } = entry;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: position.id,
      disabled: !canReorder,
      animateLayoutChanges: () => false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-2.5 ${
        omitted ? "bg-zinc-100/90" : ""
      }`}
    >
      {canReorder ? (
        <DragHandle label={dragLabel} attributes={attributes} listeners={listeners} />
      ) : null}
      <span className="w-6 shrink-0 text-sm tabular-nums text-zinc-400">
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
            onClick={() => onRestore(position)}
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
            onClick={() => onOmit(position)}
            className={isPending ? "pointer-events-none opacity-50" : ""}
          />
        )
      ) : null}
    </li>
  );
}

export function ProjectExcludedPositionsPanel({
  projectId,
  globalPositions,
  omittedIds,
  readOnly = false,
  canManage = false,
  onOmit,
  onPositionsChange,
}: ProjectExcludedPositionsPanelProps) {
  const dndContextId = useId();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [positions, setPositions] = useState(globalPositions);
  const [isPending, startTransition] = useTransition();
  const [isReorderPending, startReorderTransition] = useTransition();
  const [showHiddenOmitted, setShowHiddenOmitted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setPositions(globalPositions);
  }, [globalPositions]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const omittedSet = useMemo(
    () => new Set(normalizeExcludedPositionOmissions(omittedIds)),
    [omittedIds],
  );

  const omittedCount = useMemo(
    () => countOmittedExcludedPositions(positions, omittedIds),
    [positions, omittedIds],
  );

  const listEntries = useMemo((): ListEntry[] => {
    let activeNumber = 0;
    const entries: ListEntry[] = [];

    for (const position of positions) {
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
  }, [positions, omittedSet, showHiddenOmitted]);

  const canReorder = canManage && !readOnly && positions.length > 1;

  function resetAddForm() {
    setName("");
    setNameError(undefined);
    setAddError(null);
  }

  function handleAddOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      resetAddForm();
    }
    setAddOpen(nextOpen);
  }

  function handleAddSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setAddError(null);
    setNameError(undefined);

    if (!name.trim()) {
      setNameError(t("validation.name_required", "Ievadi nosaukumu."));
      return;
    }

    startTransition(async () => {
      const result = await createExcludedPositionFromProjectAction(
        projectId,
        name.trim(),
      );

      if (!result.ok) {
        if (result.error === "Ievadi nosaukumu.") {
          setNameError(translateActionError(t, result));
        } else {
          setAddError(translateActionError(t, result));
        }
        return;
      }

      const nextPositions = [...positions, result.position];
      setPositions(nextPositions);
      onPositionsChange(nextPositions);
      handleAddOpenChange(false);
      showFeedback({
        type: "success",
        text: t(
          "excluded_positions.feedback.added_from_project",
          "Pozīcija pievienota globālajam sarakstam.",
        ),
      });
    });
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

  function handleDragEnd(event: DragEndEvent) {
    if (!canReorder) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const visibleIdsBefore = listEntries.map((entry) => entry.position.id);
    const oldIndex = visibleIdsBefore.findIndex((id) => id === active.id);
    const newIndex = visibleIdsBefore.findIndex((id) => id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const visibleIdsAfter = arrayMove(visibleIdsBefore, oldIndex, newIndex);
    const orderedIds = mergeExcludedPositionVisibleReorder(
      positions,
      visibleIdsBefore,
      visibleIdsAfter,
    );
    const positionById = new Map(positions.map((position) => [position.id, position]));
    const nextPositions = orderedIds
      .map((id) => positionById.get(id))
      .filter((position): position is ExcludedPosition => position != null);
    const previousPositions = positions;

    setPositions(nextPositions);
    onPositionsChange(nextPositions);

    clearFeedback();
    startReorderTransition(async () => {
      const result = await reorderExcludedPositionsFromProjectAction(projectId, {
        orderedIds,
      });

      if (!result.ok) {
        setPositions(previousPositions);
        onPositionsChange(previousPositions);
        showFeedback({ type: "error", text: translateActionError(t, result) });
      }
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
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {omittedCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowHiddenOmitted((current) => !current)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
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
          {canManage && !readOnly ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
            >
              <i className="fas fa-plus text-[10px]" aria-hidden="true" />
              {t("excluded_positions.project.add_action", "Pievienot pozīciju")}
            </button>
          ) : null}
        </div>
      </div>

      {listEntries.length === 0 ? (
        <p className="px-4 py-3 text-sm text-zinc-500">
          {positions.length === 0
            ? t(
                "excluded_positions.project.empty_list",
                "Nav neiekļauto pozīciju.",
              )
            : t(
                "excluded_positions.project.all_omitted",
                "Visas globālās neiekļautās pozīcijas ir izņemtas no šī projekta piedāvājuma.",
              )}
        </p>
      ) : (
        <div className={isReorderPending ? "opacity-90" : ""}>
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={listEntries.map((entry) => entry.position.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-zinc-100">
                {listEntries.map((entry) => (
                  <SortableProjectExcludedRow
                    key={entry.position.id}
                    entry={entry}
                    readOnly={readOnly}
                    canReorder={canReorder}
                    dragLabel={t(
                      "positions.drag.named",
                      "Pārvietot pozīciju: {name}",
                      { name: entry.position.name },
                    )}
                    isPending={isPending}
                    onOmit={handleOmit}
                    onRestore={handleRestore}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <AppModal
        open={addOpen}
        onOpenChange={handleAddOpenChange}
        title={t("excluded_positions.add.title", "Pievienot neiekļauto pozīciju")}
        description={t(
          "excluded_positions.project.add_description",
          "Pozīcija tiks pievienota globālajam sarakstam un šī projekta piedāvājumam. Pārējos projektos tā būs paslēpta.",
        )}
        blocking={isPending}
        dirty={Boolean(name.trim())}
        panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
      >
        <form noValidate onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="project-excluded-position-name"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              {t("common.name", "Nosaukums")}
            </label>
            <input
              id="project-excluded-position-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(undefined);
                setAddError(null);
              }}
              autoFocus
              className={`${formInputClassName(Boolean(nameError))} ${formInputFullWidthClass}`}
              placeholder={t(
                "excluded_positions.name_placeholder",
                "Piem., Demontāžas darbi",
              )}
            />
            {nameError ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {nameError}
              </p>
            ) : null}
          </div>

          {addError ? (
            <p className="text-sm text-red-600" role="alert">
              {addError}
            </p>
          ) : null}

          <ModalFormActions
            onCancel={() => handleAddOpenChange(false)}
            cancelDisabled={isPending}
          >
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? t("actions.adding", "Pievieno…")
                : t("actions.add", "Pievienot")}
            </button>
          </ModalFormActions>
        </form>
      </AppModal>
    </section>
  );
}
