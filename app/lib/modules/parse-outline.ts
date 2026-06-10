import type { ModuleOutline, ModuleOutlineCategory } from "@/app/lib/modules/types";

function isOutlineSubcategory(
  value: unknown,
): value is { id: string; title: string } {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.title === "string";
}

function isOutlineCategory(value: unknown): value is ModuleOutlineCategory {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.title !== "string") {
    return false;
  }

  if (!Array.isArray(row.subcategories)) return false;

  return row.subcategories.every(isOutlineSubcategory);
}

export function parseModuleOutline(value: unknown): ModuleOutline {
  if (!Array.isArray(value)) return [];

  return value.filter(isOutlineCategory).map((category) => ({
    id: category.id,
    title: category.title,
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      title: subcategory.title,
    })),
  }));
}
