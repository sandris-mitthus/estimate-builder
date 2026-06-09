import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";

export function createLineItem(): EstimateLineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    unit: "gab.",
    quantity: 1,
    unitPrice: { labor: 0, materials: 0, mechanisms: 0 },
  };
}

export function createSubcategory(): EstimateSubcategory {
  return {
    id: crypto.randomUUID(),
    title: "",
    items: [],
  };
}

export function createCategory(): EstimateCategory {
  return {
    id: crypto.randomUUID(),
    title: "",
    subcategories: [],
    items: [],
  };
}
