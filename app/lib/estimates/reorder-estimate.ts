import { arrayMove } from "@dnd-kit/sortable";
import {
  canDropCategoryChild,
  findCategoryIdForDragTarget,
  insertCategoryLevelItem,
  moveCategoryChildAcrossCategories,
  removeCategoryChildRef,
  reorderCategoryChildOrder,
} from "@/app/lib/estimates/category-child-order";
import {
  categoryDragId,
  itemDragId,
  parseDragId,
  subcategoryDragId,
} from "@/app/lib/estimates/drag-ids";
import { collectAllDragIds as collectAllEstimateDragIds } from "@/app/lib/estimates/hidden-estimate-rows";
import { getRowItemId } from "@/app/lib/estimates/multi-position";
import type { EstimateCategory, EstimateRowItem } from "@/app/lib/estimates/types";

type ItemLocation = {
  categoryId: string;
  subcategoryId?: string;
  index: number;
};

export function collectAllDragIds(
  categories: EstimateCategory[],
  options?: { includeHiddenRows?: boolean },
): string[] {
  return collectAllEstimateDragIds(categories, options);
}

export function canDropDragId(
  activeDragId: string,
  overDragId: string,
  categories?: EstimateCategory[],
): boolean {
  if (categories?.length) {
    return canDropCategoryChild(categories, activeDragId, overDragId);
  }

  const active = parseDragId(activeDragId);
  const over = parseDragId(overDragId);

  if (!active || !over || activeDragId === overDragId) return false;

  if (active.kind === "category") return over.kind === "category";
  if (active.kind === "subcategory") {
    return (
      over.kind === "subcategory" ||
      over.kind === "item" ||
      over.kind === "category"
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

function reorderCategories(
  categories: EstimateCategory[],
  activeId: string,
  overId: string,
): EstimateCategory[] {
  const oldIndex = categories.findIndex(
    (category) => categoryDragId(category.id) === activeId,
  );
  const newIndex = categories.findIndex(
    (category) => categoryDragId(category.id) === overId,
  );

  if (oldIndex < 0 || newIndex < 0) return categories;
  return arrayMove(categories, oldIndex, newIndex);
}

function findCategoryIdForSubcategory(
  categories: EstimateCategory[],
  subcategoryId: string,
): string | null {
  for (const category of categories) {
    if (category.subcategories.some((subcategory) => subcategory.id === subcategoryId)) {
      return category.id;
    }
  }

  return null;
}

function findCategoryIdForCategoryChild(
  categories: EstimateCategory[],
  over: NonNullable<ReturnType<typeof parseDragId>>,
): string | null {
  if (over.kind === "category") {
    return over.id;
  }

  if (over.kind === "subcategory") {
    return findCategoryIdForDragTarget(categories, subcategoryDragId(over.id));
  }

  if (over.kind === "item") {
    return findCategoryIdForDragTarget(categories, itemDragId(over.id));
  }

  return null;
}

function moveSubcategory(
  categories: EstimateCategory[],
  activeDragId: string,
  overDragId: string,
): EstimateCategory[] {
  const active = parseDragId(activeDragId);
  const over = parseDragId(overDragId);
  if (!active || active.kind !== "subcategory" || !over) {
    return categories;
  }

  const sourceCategoryId = findCategoryIdForSubcategory(categories, active.id);
  const targetCategoryId = findCategoryIdForCategoryChild(categories, over);
  if (!sourceCategoryId || !targetCategoryId) {
    return categories;
  }

  if (sourceCategoryId === targetCategoryId) {
    return categories.map((category) => {
      if (category.id !== sourceCategoryId) {
        return category;
      }

      return reorderCategoryChildOrder(category, activeDragId, overDragId) ?? category;
    });
  }

  return moveCategoryChildAcrossCategories(categories, activeDragId, overDragId);
}

function findItemLocation(
  categories: EstimateCategory[],
  rowId: string,
): ItemLocation | null {
  for (const category of categories) {
    const directIndex = category.items.findIndex(
      (row) => getRowItemId(row) === rowId,
    );
    if (directIndex >= 0) {
      return { categoryId: category.id, index: directIndex };
    }

    for (const subcategory of category.subcategories) {
      const subIndex = subcategory.items.findIndex(
        (row) => getRowItemId(row) === rowId,
      );
      if (subIndex >= 0) {
        return {
          categoryId: category.id,
          subcategoryId: subcategory.id,
          index: subIndex,
        };
      }
    }
  }

  return null;
}

function sameContainer(a: ItemLocation, b: ItemLocation): boolean {
  return a.categoryId === b.categoryId && a.subcategoryId === b.subcategoryId;
}

function extractRowItem(
  categories: EstimateCategory[],
  rowId: string,
): { categories: EstimateCategory[]; row: EstimateRowItem | null } {
  let extracted: EstimateRowItem | null = null;

  const next = categories.map((category) => {
    const directIndex = category.items.findIndex(
      (row) => getRowItemId(row) === rowId,
    );
    if (directIndex >= 0) {
      extracted = category.items[directIndex] ?? null;
      return removeCategoryChildRef(
        {
          ...category,
          items: category.items.filter((row) => getRowItemId(row) !== rowId),
        },
        { kind: "item", id: rowId },
      );
    }

    return {
      ...category,
      subcategories: category.subcategories.map((subcategory) => ({
        ...subcategory,
        items: subcategory.items.filter((row) => {
          if (getRowItemId(row) === rowId) {
            extracted = row;
            return false;
          }
          return true;
        }),
      })),
    };
  });

  return { categories: next, row: extracted };
}

function insertRowItem(
  categories: EstimateCategory[],
  row: EstimateRowItem,
  location: ItemLocation,
): EstimateCategory[] {
  return categories.map((category) => {
    if (category.id !== location.categoryId) return category;

    if (location.subcategoryId) {
      return {
        ...category,
        subcategories: category.subcategories.map((subcategory) => {
          if (subcategory.id !== location.subcategoryId) return subcategory;

          const items = [...subcategory.items];
          items.splice(location.index, 0, row);
          return { ...subcategory, items };
        }),
      };
    }

    return insertCategoryLevelItem(category, row, location.index);
  });
}

function reorderItemsInContainer(
  categories: EstimateCategory[],
  location: ItemLocation,
  activeIndex: number,
  overIndex: number,
): EstimateCategory[] {
  return categories.map((category) => {
    if (category.id !== location.categoryId) return category;

    if (location.subcategoryId) {
      return {
        ...category,
        subcategories: category.subcategories.map((subcategory) => {
          if (subcategory.id !== location.subcategoryId) return subcategory;

          return {
            ...subcategory,
            items: arrayMove(subcategory.items, activeIndex, overIndex),
          };
        }),
      };
    }

    const activeRow = category.items[activeIndex];
    const overRow = category.items[overIndex];
    if (!activeRow || !overRow) {
      return category;
    }

    return (
      reorderCategoryChildOrder(
        category,
        itemDragId(getRowItemId(activeRow)),
        itemDragId(getRowItemId(overRow)),
      ) ?? category
    );
  });
}

function moveItem(
  categories: EstimateCategory[],
  activeRowId: string,
  overDragId: string,
): EstimateCategory[] {
  const over = parseDragId(overDragId);
  if (!over) return categories;

  const activeLoc = findItemLocation(categories, activeRowId);
  if (!activeLoc) return categories;

  if (over.kind === "item") {
    const overLoc = findItemLocation(categories, over.id);
    if (!overLoc) return categories;

    if (sameContainer(activeLoc, overLoc)) {
      return reorderItemsInContainer(
        categories,
        activeLoc,
        activeLoc.index,
        overLoc.index,
      );
    }

    const { categories: reduced, row } = extractRowItem(categories, activeRowId);
    if (!row) return categories;

    const targetLoc = findItemLocation(reduced, over.id);
    if (!targetLoc) return categories;

    return insertRowItem(reduced, row, targetLoc);
  }

  if (over.kind === "subcategory") {
    const { categories: reduced, row } = extractRowItem(categories, activeRowId);
    if (!row) return categories;

    const category = reduced.find((entry) =>
      entry.subcategories.some((sub) => sub.id === over.id),
    );
    if (!category) return categories;

    return insertRowItem(reduced, row, {
      categoryId: category.id,
      subcategoryId: over.id,
      index: 0,
    });
  }

  if (over.kind === "category") {
    const { categories: reduced, row } = extractRowItem(categories, activeRowId);
    if (!row) return categories;

    return insertRowItem(reduced, row, {
      categoryId: over.id,
      index: 0,
    });
  }

  return categories;
}

export function reorderEstimate(
  categories: EstimateCategory[],
  activeDragId: string,
  overDragId: string,
): EstimateCategory[] {
  const active = parseDragId(activeDragId);
  const over = parseDragId(overDragId);

  if (!active || !over || !canDropDragId(activeDragId, overDragId, categories)) {
    return categories;
  }

  if (active.kind === "category" && over.kind === "category") {
    return reorderCategories(categories, activeDragId, overDragId);
  }

  if (active.kind === "subcategory") {
    return moveSubcategory(categories, activeDragId, overDragId);
  }

  if (active.kind === "item") {
    return moveItem(categories, active.id, overDragId);
  }

  return categories;
}
