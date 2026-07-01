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
import { useId, type ReactNode } from "react";
import { DragHandle } from "@/app/components/drag-handle";
import type { LineItemCatalogRef } from "@/app/lib/estimates/types";

type LineItemCatalogRefSortableListProps = {
  items: LineItemCatalogRef[];
  onReorder: (items: LineItemCatalogRef[]) => void;
  getDragLabel: (item: LineItemCatalogRef) => string;
  className?: string;
  renderItem: (item: LineItemCatalogRef, index: number) => ReactNode;
};

function SortableCatalogRefRow({
  id,
  dragLabel,
  canReorder,
  children,
}: {
  id: string;
  dragLabel: string;
  canReorder: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id,
      animateLayoutChanges: () => false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      {canReorder ? (
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function LineItemCatalogRefSortableList({
  items,
  onReorder,
  getDragLabel,
  className = "space-y-1.5",
  renderItem,
}: LineItemCatalogRefSortableListProps) {
  const dndContextId = useId();
  const canReorder = items.length > 1;
  const itemIds = items.map((item) => item.positionPriceId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableCatalogRefRow
              key={item.positionPriceId}
              id={item.positionPriceId}
              dragLabel={getDragLabel(item)}
              canReorder={canReorder}
            >
              {renderItem(item, index)}
            </SortableCatalogRefRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
