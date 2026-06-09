import { arrayMove } from "@dnd-kit/sortable";
import {
  categoryDragId,
  itemDragId,
  parseDragId,
  subcategoryDragId,
} from "@/app/lib/estimates/drag-ids";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";

type ItemLocation = {
  categoryId: string;
  subcategoryId?: string;
  index: number;
};

export function collectAllDragIds(categories: EstimateCategory[]): string[] {
  const ids: string[] = [];

  for (const category of categories) {
    ids.push(categoryDragId(category.id));

    for (const subcategory of category.subcategories) {
      ids.push(subcategoryDragId(subcategory.id));
      for (const item of subcategory.items) {
        ids.push(itemDragId(item.id));
      }
    }

    for (const item of category.items) {
      ids.push(itemDragId(item.id));
    }
  }

  return ids;
}

export function canDropDragId(activeDragId: string, overDragId: string): boolean {
  const active = parseDragId(activeDragId);
  const over = parseDragId(overDragId);

  if (!active || !over || activeDragId === overDragId) return false;

  if (active.kind === "category") return over.kind === "category";
  if (active.kind === "subcategory") return over.kind === "subcategory";
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

function moveSubcategory(
  categories: EstimateCategory[],
  activeSubId: string,
  overSubId: string,
): EstimateCategory[] {
  let extracted: EstimateSubcategory | null = null;

  const reduced = categories.map((category) => {
    const index = category.subcategories.findIndex((sub) => sub.id === activeSubId);
    if (index < 0) return category;

    const subcategories = [...category.subcategories];
    extracted = subcategories[index];
    subcategories.splice(index, 1);
    return { ...category, subcategories };
  });

  if (!extracted) return categories;

  let targetCategoryId: string | null = null;
  let targetIndex = -1;

  for (const category of reduced) {
    const index = category.subcategories.findIndex((sub) => sub.id === overSubId);
    if (index >= 0) {
      targetCategoryId = category.id;
      targetIndex = index;
      break;
    }
  }

  if (!targetCategoryId || targetIndex < 0) return categories;

  return reduced.map((category) => {
    if (category.id !== targetCategoryId) return category;

    const subcategories = [...category.subcategories];
    subcategories.splice(targetIndex, 0, extracted!);
    return { ...category, subcategories };
  });
}

function findItemLocation(
  categories: EstimateCategory[],
  itemId: string,
): ItemLocation | null {
  for (const category of categories) {
    const directIndex = category.items.findIndex((item) => item.id === itemId);
    if (directIndex >= 0) {
      return { categoryId: category.id, index: directIndex };
    }

    for (const subcategory of category.subcategories) {
      const subIndex = subcategory.items.findIndex((item) => item.id === itemId);
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

function extractItem(
  categories: EstimateCategory[],
  itemId: string,
): { categories: EstimateCategory[]; item: EstimateLineItem | null } {
  let extracted: EstimateLineItem | null = null;

  const next = categories.map((category) => ({
    ...category,
    items: category.items.filter((item) => {
      if (item.id === itemId) {
        extracted = item;
        return false;
      }
      return true;
    }),
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: subcategory.items.filter((item) => {
        if (item.id === itemId) {
          extracted = item;
          return false;
        }
        return true;
      }),
    })),
  }));

  return { categories: next, item: extracted };
}

function insertItem(
  categories: EstimateCategory[],
  item: EstimateLineItem,
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
          items.splice(location.index, 0, item);
          return { ...subcategory, items };
        }),
      };
    }

    const items = [...category.items];
    items.splice(location.index, 0, item);
    return { ...category, items };
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

    return {
      ...category,
      items: arrayMove(category.items, activeIndex, overIndex),
    };
  });
}

function moveItem(
  categories: EstimateCategory[],
  activeItemId: string,
  overDragId: string,
): EstimateCategory[] {
  const over = parseDragId(overDragId);
  if (!over) return categories;

  const activeLoc = findItemLocation(categories, activeItemId);
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

    const { categories: reduced, item } = extractItem(categories, activeItemId);
    if (!item) return categories;

    const targetLoc = findItemLocation(reduced, over.id);
    if (!targetLoc) return categories;

    return insertItem(reduced, item, targetLoc);
  }

  if (over.kind === "subcategory") {
    const { categories: reduced, item } = extractItem(categories, activeItemId);
    if (!item) return categories;

    const category = reduced.find((entry) =>
      entry.subcategories.some((sub) => sub.id === over.id),
    );
    if (!category) return categories;

    return insertItem(reduced, item, {
      categoryId: category.id,
      subcategoryId: over.id,
      index: 0,
    });
  }

  if (over.kind === "category") {
    const { categories: reduced, item } = extractItem(categories, activeItemId);
    if (!item) return categories;

    return insertItem(reduced, item, {
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

  if (!active || !over || !canDropDragId(activeDragId, overDragId)) {
    return categories;
  }

  if (active.kind === "category" && over.kind === "category") {
    return reorderCategories(categories, activeDragId, overDragId);
  }

  if (active.kind === "subcategory" && over.kind === "subcategory") {
    return moveSubcategory(categories, active.id, over.id);
  }

  if (active.kind === "item") {
    return moveItem(categories, active.id, overDragId);
  }

  return categories;
}
