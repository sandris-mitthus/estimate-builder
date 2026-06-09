export function categoryDragId(id: string): string {
  return `category:${id}`;
}

export function subcategoryDragId(id: string): string {
  return `subcategory:${id}`;
}

export function itemDragId(id: string): string {
  return `item:${id}`;
}

export type DragKind = "category" | "subcategory" | "item";

export function parseDragId(
  dragId: string,
): { kind: DragKind; id: string } | null {
  const [kind, ...rest] = dragId.split(":");
  const id = rest.join(":");

  if (!id) return null;
  if (kind === "category" || kind === "subcategory" || kind === "item") {
    return { kind, id };
  }

  return null;
}
