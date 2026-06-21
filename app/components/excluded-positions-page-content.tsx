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
import { useEffect, useId, useState, useTransition } from "react";
import { reorderExcludedPositionsAction } from "@/app/(protected)/excluded-positions/actions";
import { AddExcludedPositionButton } from "@/app/components/add-excluded-position-button";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { DragHandle } from "@/app/components/drag-handle";
import { ExcludedPositionRowActions } from "@/app/components/excluded-position-row-actions";
import { SectionPage } from "@/app/components/section-page";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";

type ExcludedPositionsPageContentProps = {
  initialPositions: ExcludedPosition[];
};

function SortableExcludedPositionRow({
  position,
  index,
  canReorder,
  dragLabel,
}: {
  position: ExcludedPosition;
  index: number;
  canReorder: boolean;
  dragLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: position.id,
      animateLayoutChanges: () => false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border-b border-zinc-100 px-3 py-3 last:border-b-0"
    >
      {canReorder ? (
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
      ) : null}
      <span className="w-6 shrink-0 text-sm tabular-nums text-zinc-400">{index + 1}.</span>
      <p className="min-w-0 flex-1 text-sm text-zinc-900">{position.name}</p>
      <ExcludedPositionRowActions position={position} />
    </div>
  );
}

export function ExcludedPositionsPageContent({
  initialPositions,
}: ExcludedPositionsPageContentProps) {
  const dndContextId = useId();
  const canManage = useActionPermission("excluded_positions.manage");
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [positions, setPositions] = useState(initialPositions);
  const [isReorderPending, startReorderTransition] = useTransition();

  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!canManage) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = positions.findIndex((position) => position.id === active.id);
    const newIndex = positions.findIndex((position) => position.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousPositions = positions;
    const nextPositions = arrayMove(positions, oldIndex, newIndex);
    setPositions(nextPositions);

    clearFeedback();
    startReorderTransition(async () => {
      const result = await reorderExcludedPositionsAction({
        orderedIds: nextPositions.map((position) => position.id),
      });

      if (!result.ok) {
        setPositions(previousPositions);
        showFeedback({ type: "error", text: translateActionError(t, result) });
      }
    });
  }

  return (
    <SectionPage
      title={t("nav.excluded_positions", "Neiekļautās pozīcijas")}
      subtitle={
        positions.length === 0
          ? t("excluded_positions.empty.subtitle", "Nav definētu pozīciju")
          : t(
              "excluded_positions.page.subtitle",
              "{count} pozīcijas piedāvājumā neiekļautas",
              { count: positions.length },
            )
      }
      actions={<AddExcludedPositionButton />}
    >
      {positions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            {t(
              "excluded_positions.empty.description",
              "Pievieno pozīcijas, kas netiek iekļautas piedāvājumā. Saraksts parādīsies piedāvājuma PDF.",
            )}
          </p>
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${
            isReorderPending ? "opacity-90" : ""
          }`}
        >
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={positions.map((position) => position.id)}
              strategy={verticalListSortingStrategy}
            >
              {positions.map((position, index) => (
                <SortableExcludedPositionRow
                  key={position.id}
                  position={position}
                  index={index}
                  canReorder={canManage}
                  dragLabel={t("positions.drag.named", "Pārvietot pozīciju: {name}", {
                    name: position.name,
                  })}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </SectionPage>
  );
}
