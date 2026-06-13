import {
  isEstimateMultiPosition,
  MULTI_POSITION_NONE_OPTION_ID,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateMultiPositionOption,
  EstimateRowItem,
  EstimateSubcategory,
  MultiOptionLinkGroup,
} from "@/app/lib/estimates/types";

function cloneLineItem(item: EstimateLineItem): EstimateLineItem {
  return {
    ...item,
    id: crypto.randomUUID(),
    unitPrice: { ...item.unitPrice },
    // variableQuantity pozīcijām apjoms tiek ievadīts katrā projektā atsevišķi
    ...(item.variableQuantity === true ? { quantity: 0 } : {}),
  };
}

function cloneMultiOption(
  option: EstimateMultiPositionOption,
  optionIdMap: Map<string, string>,
): EstimateMultiPositionOption {
  const nextId = crypto.randomUUID();
  optionIdMap.set(option.id, nextId);

  return {
    id: nextId,
    lineItem: cloneLineItem(option.lineItem),
  };
}

function remapSelectedOptionId(
  selectedOptionId: string | null | undefined,
  optionIdMap: Map<string, string>,
): string | null {
  if (!selectedOptionId || selectedOptionId === MULTI_POSITION_NONE_OPTION_ID) {
    return null;
  }

  return optionIdMap.get(selectedOptionId) ?? null;
}

export function cloneRowItem(
  row: EstimateRowItem,
  optionIdMap: Map<string, string>,
): EstimateRowItem {
  if (!isEstimateMultiPosition(row)) {
    return cloneLineItem(row);
  }

  const multi = row as EstimateMultiPosition;
  const options = multi.options.map((option) => cloneMultiOption(option, optionIdMap));

  return {
    ...multi,
    id: crypto.randomUUID(),
    selectedOptionId: remapSelectedOptionId(multi.selectedOptionId, optionIdMap),
    options,
  };
}

export function cloneSubcategory(
  subcategory: EstimateSubcategory,
  optionIdMap: Map<string, string>,
): EstimateSubcategory {
  return {
    ...subcategory,
    id: crypto.randomUUID(),
    items: subcategory.items.map((row) => cloneRowItem(row, optionIdMap)),
  };
}

export function cloneCategory(
  category: EstimateCategory,
  optionIdMap: Map<string, string>,
): EstimateCategory {
  return {
    ...category,
    id: crypto.randomUUID(),
    subcategories: category.subcategories.map((subcategory) =>
      cloneSubcategory(subcategory, optionIdMap),
    ),
    items: category.items.map((row) => cloneRowItem(row, optionIdMap)),
  };
}

export function remapMultiOptionLinks(
  links: MultiOptionLinkGroup[],
  optionIdMap: Map<string, string>,
): MultiOptionLinkGroup[] {
  return links
    .map((group) => ({
      id: crypto.randomUUID(),
      optionIds: group.optionIds
        .map((optionId) => optionIdMap.get(optionId))
        .filter((optionId): optionId is string => Boolean(optionId)),
    }))
    .filter((group) => group.optionIds.length >= 2);
}

export function cloneSagataveDocumentForProject(
  sections: EstimateCategory[],
  multiOptionLinks: MultiOptionLinkGroup[] = [],
): {
  categories: EstimateCategory[];
  multiOptionLinks: MultiOptionLinkGroup[];
} {
  const optionIdMap = new Map<string, string>();
  const categories = sections.map((section) => cloneCategory(section, optionIdMap));

  return {
    categories,
    multiOptionLinks: remapMultiOptionLinks(multiOptionLinks, optionIdMap),
  };
}
