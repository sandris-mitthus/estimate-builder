import { arrayMove } from "@/app/lib/array-move";
import {
  categoryDragId,
  itemDragId,
  parseDragId,
  subcategoryDragId,
} from "@/app/lib/estimates/drag-ids";
import { getRowItemId } from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateCategoryChildRef,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";

export function buildDefaultCategoryChildOrder(
  category: Pick<EstimateCategory, "subcategories" | "items">,
): EstimateCategoryChildRef[] {
  return [
    ...category.subcategories.map((subcategory) => ({
      kind: "subcategory" as const,
      id: subcategory.id,
    })),
    ...category.items.map((row) => ({
      kind: "item" as const,
      id: getRowItemId(row),
    })),
  ];
}

function childRefKey(ref: EstimateCategoryChildRef): string {
  return ref.kind === "subcategory" ? `sub:${ref.id}` : `item:${ref.id}`;
}

function childRefFromDragId(
  dragId: string,
): EstimateCategoryChildRef | null {
  const parsed = parseDragId(dragId);
  if (!parsed) {
    return null;
  }

  if (parsed.kind === "subcategory") {
    return { kind: "subcategory", id: parsed.id };
  }

  if (parsed.kind === "item") {
    return { kind: "item", id: parsed.id };
  }

  return null;
}

export function resolveCategoryChildOrder(
  category: EstimateCategory,
): EstimateCategoryChildRef[] {
  const defaultOrder = buildDefaultCategoryChildOrder(category);
  if (!category.childOrder?.length) {
    return defaultOrder;
  }

  const seen = new Set<string>();
  const order: EstimateCategoryChildRef[] = [];

  for (const ref of category.childOrder) {
    if (ref.kind === "subcategory") {
      if (!category.subcategories.some((subcategory) => subcategory.id === ref.id)) {
        continue;
      }
    } else if (!category.items.some((row) => getRowItemId(row) === ref.id)) {
      continue;
    }

    const key = childRefKey(ref);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    order.push(ref);
  }

  for (const ref of defaultOrder) {
    const key = childRefKey(ref);
    if (!seen.has(key)) {
      order.push(ref);
      seen.add(key);
    }
  }

  return order;
}

export function syncSubcategoriesOrderFromChildOrder(
  category: EstimateCategory,
): EstimateSubcategory[] {
  const order = resolveCategoryChildOrder(category);
  const subcategoryById = new Map(
    category.subcategories.map((subcategory) => [subcategory.id, subcategory]),
  );
  const ordered: EstimateSubcategory[] = [];

  for (const ref of order) {
    if (ref.kind !== "subcategory") {
      continue;
    }

    const subcategory = subcategoryById.get(ref.id);
    if (!subcategory) {
      continue;
    }

    ordered.push(subcategory);
    subcategoryById.delete(ref.id);
  }

  for (const subcategory of subcategoryById.values()) {
    ordered.push(subcategory);
  }

  return ordered;
}

export function syncChildOrderItemPositions(
  category: EstimateCategory,
): EstimateCategoryChildRef[] {
  const order = resolveCategoryChildOrder(category);
  const itemIds = category.items.map((row) => getRowItemId(row));
  const itemQueue = [...itemIds];
  const nextOrder: EstimateCategoryChildRef[] = [];

  for (const ref of order) {
    if (ref.kind === "subcategory") {
      nextOrder.push(ref);
      continue;
    }

    const nextItemId = itemQueue.shift();
    if (nextItemId) {
      nextOrder.push({ kind: "item", id: nextItemId });
    }
  }

  while (itemQueue.length > 0) {
    nextOrder.push({ kind: "item", id: itemQueue.shift()! });
  }

  return nextOrder;
}

export function withNormalizedCategoryChildOrder(
  category: EstimateCategory,
): EstimateCategory {
  const childOrder = syncChildOrderItemPositions(category);
  return {
    ...category,
    childOrder,
    subcategories: syncSubcategoriesOrderFromChildOrder({
      ...category,
      childOrder,
    }),
  };
}

export function appendCategoryChild(
  category: EstimateCategory,
  ref: EstimateCategoryChildRef,
): EstimateCategory {
  const normalized = withNormalizedCategoryChildOrder(category);
  return {
    ...normalized,
    childOrder: [...(normalized.childOrder ?? []), ref],
  };
}

export function removeCategoryChildRef(
  category: EstimateCategory,
  ref: EstimateCategoryChildRef,
): EstimateCategory {
  const key = childRefKey(ref);
  const childOrder = resolveCategoryChildOrder(category).filter(
    (entry) => childRefKey(entry) !== key,
  );

  return withNormalizedCategoryChildOrder({
    ...category,
    childOrder,
  });
}

export function collectCategoryChildDragIds(
  category: EstimateCategory,
): string[] {
  const ids: string[] = [];

  for (const ref of resolveCategoryChildOrder(category)) {
    if (ref.kind === "subcategory") {
      ids.push(subcategoryDragId(ref.id));
      const subcategory = category.subcategories.find(
        (entry) => entry.id === ref.id,
      );
      if (!subcategory) {
        continue;
      }

      for (const row of subcategory.items) {
        ids.push(itemDragId(getRowItemId(row)));
      }
      continue;
    }

    ids.push(itemDragId(ref.id));
  }

  return ids;
}

function findCategoryContainingChild(
  categories: EstimateCategory[],
  ref: EstimateCategoryChildRef,
): EstimateCategory | null {
  for (const category of categories) {
    if (ref.kind === "subcategory") {
      if (category.subcategories.some((subcategory) => subcategory.id === ref.id)) {
        return category;
      }
      continue;
    }

    if (category.items.some((row) => getRowItemId(row) === ref.id)) {
      return category;
    }
  }

  return null;
}

export function reorderCategoryChildOrder(
  category: EstimateCategory,
  activeDragId: string,
  overDragId: string,
): EstimateCategory | null {
  const activeRef = childRefFromDragId(activeDragId);
  if (!activeRef) {
    return null;
  }

  const order = resolveCategoryChildOrder(category);
  const activeIndex = order.findIndex(
    (entry) => childRefKey(entry) === childRefKey(activeRef),
  );
  if (activeIndex < 0) {
    return null;
  }

  const dropTarget = resolveCategoryChildDropTarget(
    category,
    activeDragId,
    overDragId,
  );
  if (!dropTarget) {
    return null;
  }

  let overIndex = -1;

  if (dropTarget === "end") {
    overIndex = order.length - 1;
  } else {
    overIndex = order.findIndex(
      (entry) => childRefKey(entry) === childRefKey(dropTarget),
    );
  }

  if (overIndex < 0) {
    return null;
  }

  const nextOrder = arrayMove(order, activeIndex, overIndex);
  let nextCategory: EstimateCategory = {
    ...category,
    childOrder: nextOrder,
    subcategories: syncSubcategoriesOrderFromChildOrder({
      ...category,
      childOrder: nextOrder,
    }),
  };

  if (activeRef.kind === "item" && dropTarget !== "end" && dropTarget.kind === "item") {
    const activeItemIndex = category.items.findIndex(
      (row) => getRowItemId(row) === activeRef.id,
    );
    const overItemIndex = category.items.findIndex(
      (row) => getRowItemId(row) === dropTarget.id,
    );

    if (activeItemIndex >= 0 && overItemIndex >= 0) {
      nextCategory = {
        ...nextCategory,
        items: arrayMove(category.items, activeItemIndex, overItemIndex),
      };
    }
  }

  return nextCategory;
}

export function findCategoryIdForDragTarget(
  categories: EstimateCategory[],
  overDragId: string,
): string | null {
  const over = parseDragId(overDragId);
  if (!over) {
    return null;
  }

  if (over.kind === "category") {
    return over.id;
  }

  for (const category of categories) {
    if (
      over.kind === "subcategory" &&
      category.subcategories.some((subcategory) => subcategory.id === over.id)
    ) {
      return category.id;
    }

    if (over.kind === "item") {
      if (
        isCategoryLevelItem(category, over.id) ||
        findSubcategoryContainingItem(category, over.id)
      ) {
        return category.id;
      }
    }
  }

  return null;
}

export function moveCategoryChildAcrossCategories(
  categories: EstimateCategory[],
  activeDragId: string,
  overDragId: string,
): EstimateCategory[] {
  const activeRef = childRefFromDragId(activeDragId);
  if (!activeRef || activeRef.kind !== "subcategory") {
    return categories;
  }

  const sourceCategory = findCategoryContainingChild(categories, activeRef);
  const targetCategoryId = findCategoryIdForDragTarget(categories, overDragId);
  const targetCategory = categories.find(
    (category) => category.id === targetCategoryId,
  );
  if (!sourceCategory || !targetCategory) {
    return categories;
  }

  const dropTarget = resolveCategoryChildDropTarget(
    targetCategory,
    activeDragId,
    overDragId,
  );
  if (!dropTarget) {
    return categories;
  }

  const extractedSubcategory = sourceCategory.subcategories.find(
    (subcategory) => subcategory.id === activeRef.id,
  );
  if (!extractedSubcategory) {
    return categories;
  }

  const reduced = categories.map((category) => {
    if (category.id !== sourceCategory.id) {
      return category;
    }

    const childOrder = resolveCategoryChildOrder(category).filter(
      (entry) => childRefKey(entry) !== childRefKey(activeRef),
    );

    return {
      ...category,
      subcategories: category.subcategories.filter(
        (subcategory) => subcategory.id !== activeRef.id,
      ),
      childOrder,
    };
  });

  return reduced.map((category) => {
    if (category.id !== targetCategory.id) {
      return category;
    }

    const order = resolveCategoryChildOrder(category);
    const insertIndex =
      dropTarget === "end"
        ? order.length
        : order.findIndex(
            (entry) => childRefKey(entry) === childRefKey(dropTarget),
          );
    const nextOrder = [...order];
    nextOrder.splice(insertIndex >= 0 ? insertIndex : order.length, 0, activeRef);

    const subcategories = syncSubcategoriesOrderFromChildOrder({
      ...category,
      childOrder: nextOrder,
    });
    if (!subcategories.some((subcategory) => subcategory.id === extractedSubcategory.id)) {
      subcategories.splice(
        insertIndex >= 0 ? insertIndex : subcategories.length,
        0,
        extractedSubcategory,
      );
    }

    return {
      ...category,
      subcategories,
      childOrder: nextOrder,
    };
  });
}

export function resolveCategoryChildren(
  category: EstimateCategory,
): Array<
  | { kind: "subcategory"; subcategory: EstimateSubcategory }
  | { kind: "item"; row: EstimateRowItem }
> {
  const children: Array<
    | { kind: "subcategory"; subcategory: EstimateSubcategory }
    | { kind: "item"; row: EstimateRowItem }
  > = [];

  for (const ref of resolveCategoryChildOrder(category)) {
    if (ref.kind === "subcategory") {
      const subcategory = category.subcategories.find(
        (entry) => entry.id === ref.id,
      );
      if (subcategory) {
        children.push({ kind: "subcategory", subcategory });
      }
      continue;
    }

    const row = category.items.find((entry) => getRowItemId(entry) === ref.id);
    if (row) {
      children.push({ kind: "item", row });
    }
  }

  return children;
}

export function isCategoryLevelItem(
  category: EstimateCategory,
  itemId: string,
): boolean {
  return category.items.some((row) => getRowItemId(row) === itemId);
}

export function findSubcategoryContainingItem(
  category: EstimateCategory,
  itemId: string,
): EstimateSubcategory | null {
  return (
    category.subcategories.find((subcategory) =>
      subcategory.items.some((row) => getRowItemId(row) === itemId),
    ) ?? null
  );
}

export function resolveCategoryChildDropTarget(
  category: EstimateCategory,
  activeDragId: string,
  overDragId: string,
): EstimateCategoryChildRef | "end" | null {
  const active = parseDragId(activeDragId);
  const over = parseDragId(overDragId);
  if (!active || !over) {
    return null;
  }

  if (over.kind === "category") {
    return over.id === category.id ? "end" : null;
  }

  if (over.kind === "subcategory") {
    return category.subcategories.some((subcategory) => subcategory.id === over.id)
      ? { kind: "subcategory", id: over.id }
      : null;
  }

  if (over.kind !== "item") {
    return null;
  }

  if (isCategoryLevelItem(category, over.id)) {
    return { kind: "item", id: over.id };
  }

  const containingSubcategory = findSubcategoryContainingItem(category, over.id);
  if (!containingSubcategory) {
    return null;
  }

  if (
    active.kind === "subcategory" &&
    active.id === containingSubcategory.id
  ) {
    return null;
  }

  return { kind: "subcategory", id: containingSubcategory.id };
}

export function canDropCategoryChild(
  categories: EstimateCategory[],
  activeDragId: string,
  overDragId: string,
): boolean {
  const active = parseDragId(activeDragId);
  const over = parseDragId(overDragId);
  if (!active || !over || activeDragId === overDragId) {
    return false;
  }

  if (active.kind === "category") {
    return over.kind === "category";
  }

  if (active.kind === "subcategory") {
    if (over.kind === "category" || over.kind === "subcategory") {
      return true;
    }

    if (over.kind !== "item") {
      return false;
    }

    const targetCategory = categories.find((category) => {
      if (isCategoryLevelItem(category, over.id)) {
        return true;
      }

      return findSubcategoryContainingItem(category, over.id) != null;
    });

    if (!targetCategory) {
      return false;
    }

    return (
      resolveCategoryChildDropTarget(
        targetCategory,
        activeDragId,
        overDragId,
      ) != null
    );
  }

  if (active.kind === "item") {
    return (
      over.kind === "item" ||
      over.kind === "subcategory" ||
      over.kind === "category"
    );
  }

  return false;
}

export function insertCategoryLevelItem(
  category: EstimateCategory,
  row: EstimateRowItem,
  index: number,
): EstimateCategory {
  const items = [...category.items];
  items.splice(index, 0, row);

  const childOrder = resolveCategoryChildOrder(category);
  const itemRef: EstimateCategoryChildRef = {
    kind: "item",
    id: getRowItemId(row),
  };

  const itemPositions = childOrder
    .map((entry, entryIndex) =>
      entry.kind === "item" ? entryIndex : -1,
    )
    .filter((entryIndex) => entryIndex >= 0);

  const targetChildIndex =
    index <= 0
      ? itemPositions[0] ?? childOrder.length
      : index >= itemPositions.length
        ? childOrder.length
        : itemPositions[index];

  const nextOrder = [...childOrder];
  nextOrder.splice(targetChildIndex, 0, itemRef);

  return withNormalizedCategoryChildOrder({
    ...category,
    items,
    childOrder: nextOrder,
  });
}
