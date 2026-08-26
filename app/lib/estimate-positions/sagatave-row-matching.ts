import {
  getRowItemId,
  isEstimateLineItem,
  isEstimateMultiPosition,
  resolveLineItemDisplayName,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";

export function normalizeRowTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function rowItemLabel(row: EstimateRowItem): string {
  if (isEstimateMultiPosition(row)) {
    return row.name.trim() || "—";
  }

  return resolveLineItemDisplayName(row);
}

export function sameRowKind(a: EstimateRowItem, b: EstimateRowItem): boolean {
  return isEstimateMultiPosition(a) === isEstimateMultiPosition(b);
}

/**
 * Stabila atbilstības atslēga line-item rindai.
 * Tukši nosaukumi netiek uzskatīti par savstarpēju atbilstību — citādi
 * nesen pievienotās pozīcijas (bieži bez nosaukuma) tiek kļūdaini sasaistītas
 * ar vecajām, kad projektu rindas ir nobīdītas pret sagatavi.
 */
export function lineItemCorrespondenceKey(
  item: EstimateLineItem,
): string | null {
  const name = normalizeRowTitle(item.name);
  if (name) {
    return `name:${name}`;
  }

  const priceId = item.positionPriceId?.trim();
  if (priceId) {
    return `price:${priceId}`;
  }

  const display = normalizeRowTitle(resolveLineItemDisplayName(item));
  if (display && display !== "—") {
    return `display:${display}`;
  }

  return null;
}

export function lineItemsCorrespond(
  a: EstimateLineItem,
  b: EstimateLineItem,
): boolean {
  const leftKey = lineItemCorrespondenceKey(a);
  const rightKey = lineItemCorrespondenceKey(b);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

function normalizedMultiLabel(multi: EstimateMultiPosition): string {
  return normalizeRowTitle(multi.name.trim() || "—");
}

export function getNormalizedMultiLabel(multi: EstimateMultiPosition): string {
  return normalizedMultiLabel(multi);
}

/**
 * Visas multi-pozīcijas ar to pašu nosaukumu visā tāmes struktūrā.
 */
export function collectEstimateMultisByLabel(
  sections: EstimateCategory[],
  label: string,
): EstimateMultiPosition[] {
  const normalized = normalizeRowTitle(label.trim() || "—");
  const found: EstimateMultiPosition[] = [];

  const visit = (items: EstimateRowItem[]) => {
    for (const row of items) {
      if (
        isEstimateMultiPosition(row) &&
        normalizedMultiLabel(row) === normalized
      ) {
        found.push(row);
      }
    }
  };

  for (const category of sections) {
    visit(category.items);
    for (const subcategory of category.subcategories) {
      visit(subcategory.items);
    }
  }

  return found;
}

/**
 * Apvieno opcijas no vienādi nosauktām multi: primārās secībā, tad trūkstošās no pārējām.
 * Vajadzīgs, ja sagatavē „Extra karkass” ir vairākās kategorijās un opcija pievienota tikai vienā.
 */
export function unionMultiOptionsPreferringPrimary(
  primary: EstimateMultiPosition,
  sameNamed: readonly EstimateMultiPosition[],
): EstimateMultiPosition["options"] {
  const result = [...primary.options];
  const seenKeys = new Set<string>();

  for (const option of result) {
    const key = lineItemCorrespondenceKey(option.lineItem);
    if (key) {
      seenKeys.add(key);
    }
  }

  for (const multi of sameNamed) {
    if (multi.id === primary.id) {
      continue;
    }

    for (const option of multi.options) {
      const key = lineItemCorrespondenceKey(option.lineItem);
      if (key) {
        if (seenKeys.has(key)) {
          continue;
        }
        seenKeys.add(key);
        result.push(option);
        continue;
      }

      if (
        result.some((existing) =>
          lineItemsCorrespond(existing.lineItem, option.lineItem),
        )
      ) {
        continue;
      }

      result.push(option);
    }
  }

  return result;
}

/**
 * Vai divas rindas atbilst vienai un tai pašai sagataves / projekta pozīcijai.
 */
export function rowsCorrespond(a: EstimateRowItem, b: EstimateRowItem): boolean {
  if (!sameRowKind(a, b)) {
    return false;
  }

  if (isEstimateMultiPosition(a) && isEstimateMultiPosition(b)) {
    return normalizedMultiLabel(a) === normalizedMultiLabel(b);
  }

  if (isEstimateLineItem(a) && isEstimateLineItem(b)) {
    return lineItemsCorrespond(a, b);
  }

  return false;
}

function countSameMultiOccurrenceBefore(
  items: EstimateRowItem[],
  rowIndex: number,
): number {
  const target = items[rowIndex];
  if (!target || !isEstimateMultiPosition(target)) {
    return 0;
  }

  const label = normalizedMultiLabel(target);
  let occurrence = 0;

  for (let index = 0; index < rowIndex; index++) {
    const row = items[index];
    if (isEstimateMultiPosition(row) && normalizedMultiLabel(row) === label) {
      occurrence++;
    }
  }

  return occurrence;
}

function findNthMultiByLabel(
  items: EstimateRowItem[],
  label: string,
  occurrence: number,
): EstimateMultiPosition | undefined {
  let seen = 0;

  for (const row of items) {
    if (!isEstimateMultiPosition(row)) {
      continue;
    }

    if (normalizedMultiLabel(row) !== label) {
      continue;
    }

    if (seen === occurrence) {
      return row;
    }

    seen++;
  }

  return undefined;
}

function findMultiByNameOccurrence(
  targetItems: EstimateRowItem[],
  sourceItems: EstimateRowItem[],
  sourceIndex: number,
  sourceRow: EstimateMultiPosition,
): EstimateMultiPosition | undefined {
  const label = normalizedMultiLabel(sourceRow);
  const occurrence = countSameMultiOccurrenceBefore(sourceItems, sourceIndex);
  return findNthMultiByLabel(targetItems, label, occurrence);
}

function countSameLineOccurrenceBefore(
  items: EstimateRowItem[],
  rowIndex: number,
): number {
  const target = items[rowIndex];
  if (!target || !isEstimateLineItem(target)) {
    return 0;
  }

  const key = lineItemCorrespondenceKey(target);
  if (!key) {
    return 0;
  }

  let occurrence = 0;

  for (let index = 0; index < rowIndex; index++) {
    const row = items[index];
    if (
      isEstimateLineItem(row) &&
      lineItemCorrespondenceKey(row) === key
    ) {
      occurrence++;
    }
  }

  return occurrence;
}

function findNthLineByKey(
  items: EstimateRowItem[],
  key: string,
  occurrence: number,
): EstimateLineItem | undefined {
  let seen = 0;

  for (const row of items) {
    if (!isEstimateLineItem(row)) {
      continue;
    }

    if (lineItemCorrespondenceKey(row) !== key) {
      continue;
    }

    if (seen === occurrence) {
      return row;
    }

    seen++;
  }

  return undefined;
}

function findLineByKeyOccurrence(
  targetItems: EstimateRowItem[],
  sourceItems: EstimateRowItem[],
  sourceIndex: number,
  sourceRow: EstimateLineItem,
): EstimateLineItem | undefined {
  const key = lineItemCorrespondenceKey(sourceRow);
  if (!key) {
    return undefined;
  }

  const occurrence = countSameLineOccurrenceBefore(sourceItems, sourceIndex);
  return findNthLineByKey(targetItems, key, occurrence);
}

export function buildSagataveMultiLabelCounts(
  items: EstimateRowItem[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of items) {
    if (!isEstimateMultiPosition(row)) {
      continue;
    }

    const label = normalizedMultiLabel(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return counts;
}

export function getMultiLabelOccurrenceAtIndex(
  items: EstimateRowItem[],
  rowIndex: number,
): { label: string; occurrence: number } | null {
  const row = items[rowIndex];
  if (!row || !isEstimateMultiPosition(row)) {
    return null;
  }

  const label = normalizedMultiLabel(row);
  let occurrence = 0;

  for (let index = 0; index < rowIndex; index++) {
    const candidate = items[index];
    if (
      isEstimateMultiPosition(candidate) &&
      normalizedMultiLabel(candidate) === label
    ) {
      occurrence++;
    }
  }

  return { label, occurrence };
}

/**
 * Atrod projekta rindu, kas atbilst sagataves rindai (nevis jaunu pozīciju).
 */
export function findProjectRowForSagataveRow(
  projectItems: EstimateRowItem[],
  sagataveRow: EstimateRowItem,
  rowIndex: number,
  sagataveItemCount: number,
  sagataveItems: EstimateRowItem[],
): EstimateRowItem | undefined {
  if (isEstimateMultiPosition(sagataveRow)) {
    return findMultiByNameOccurrence(
      projectItems,
      sagataveItems,
      rowIndex,
      sagataveRow,
    );
  }

  if (isEstimateLineItem(sagataveRow)) {
    const byOccurrence = findLineByKeyOccurrence(
      projectItems,
      sagataveItems,
      rowIndex,
      sagataveRow,
    );
    if (byOccurrence) {
      return byOccurrence;
    }

    const byIndex = projectItems[rowIndex];
    if (
      byIndex &&
      isEstimateLineItem(byIndex) &&
      projectItems.length === sagataveItemCount &&
      !lineItemCorrespondenceKey(byIndex) &&
      !lineItemCorrespondenceKey(sagataveRow)
    ) {
      // Abām rindām nav atslēgas (tukšs nosaukums/materiāls) — tikai vienāda garuma
      // sarakstā pieņemam indeksa pāri, lai nezaudētu lauku sync.
      return byIndex;
    }
  }

  return undefined;
}

/**
 * Atrod projekta rindu sagataves rindai, ja tā vēl nav pāra ar citu sagataves rindu.
 */
export function findUnpairedProjectRowForSagataveRow(
  projectItems: EstimateRowItem[],
  sagataveRow: EstimateRowItem,
  rowIndex: number,
  sagataveItems: EstimateRowItem[],
  usedProjectRowIds: ReadonlySet<string>,
): EstimateRowItem | undefined {
  const match = findProjectRowForSagataveRow(
    projectItems,
    sagataveRow,
    rowIndex,
    sagataveItems.length,
    sagataveItems,
  );

  if (!match) {
    return undefined;
  }

  const matchId = getRowItemId(match);
  if (usedProjectRowIds.has(matchId)) {
    return undefined;
  }

  return match;
}

/**
 * Projekta rindu ID, kas vienā pret vienu atbilst sagataves rindām (secībā).
 */
export function collectOneToOnePairedProjectRowIds(
  sagataveItems: EstimateRowItem[],
  projectItems: EstimateRowItem[],
): Set<string> {
  const pairedIds = new Set<string>();

  for (let rowIndex = 0; rowIndex < sagataveItems.length; rowIndex++) {
    const match = findUnpairedProjectRowForSagataveRow(
      projectItems,
      sagataveItems[rowIndex],
      rowIndex,
      sagataveItems,
      pairedIds,
    );

    if (match) {
      pairedIds.add(getRowItemId(match));
    }
  }

  return pairedIds;
}

/**
 * Atrod sagataves rindu, kas atbilst projekta rindai.
 */
export function findSagataveRowForProjectRow(
  sagataveItems: EstimateRowItem[],
  projectRow: EstimateRowItem,
  rowIndex: number,
  projectItemCount: number,
  projectItems: EstimateRowItem[],
): EstimateRowItem | undefined {
  if (isEstimateMultiPosition(projectRow)) {
    return findMultiByNameOccurrence(
      sagataveItems,
      projectItems,
      rowIndex,
      projectRow,
    );
  }

  if (isEstimateLineItem(projectRow)) {
    const byOccurrence = findLineByKeyOccurrence(
      sagataveItems,
      projectItems,
      rowIndex,
      projectRow,
    );
    if (byOccurrence) {
      return byOccurrence;
    }

    const byIndex = sagataveItems[rowIndex];
    if (
      byIndex &&
      isEstimateLineItem(byIndex) &&
      sagataveItems.length === projectItemCount &&
      !lineItemCorrespondenceKey(byIndex) &&
      !lineItemCorrespondenceKey(projectRow)
    ) {
      return byIndex;
    }
  }

  return undefined;
}

export function findSagataveCategoryForProject(
  sagataveSections: EstimateCategory[],
  projectCategory: EstimateCategory,
  categoryIndex: number,
): EstimateCategory | undefined {
  const normalizedTitle = normalizeRowTitle(projectCategory.title);
  if (normalizedTitle) {
    const byTitle = sagataveSections.find(
      (section) => normalizeRowTitle(section.title) === normalizedTitle,
    );
    if (byTitle) return byTitle;
  }

  return sagataveSections[categoryIndex];
}

export function findSagataveSubcategoryForProject(
  sagataveSubcategories: EstimateSubcategory[],
  projectSubcategory: EstimateSubcategory,
  subcategoryIndex: number,
): EstimateSubcategory | undefined {
  const normalizedTitle = normalizeRowTitle(projectSubcategory.title);
  if (normalizedTitle) {
    const byTitle = sagataveSubcategories.find(
      (subcategory) => normalizeRowTitle(subcategory.title) === normalizedTitle,
    );
    if (byTitle) return byTitle;
  }

  return sagataveSubcategories[subcategoryIndex];
}

export function findCorrespondingOptionLineItems(
  sagataveOptions: { lineItem: EstimateLineItem }[],
  projectOptions: { lineItem: EstimateLineItem }[],
  optionIndex: number,
): {
  sagataveLineItem?: EstimateLineItem;
  projectLineItem?: EstimateLineItem;
} {
  const sagataveLineItem = sagataveOptions[optionIndex]?.lineItem;
  const projectLineItem = projectOptions[optionIndex]?.lineItem;

  if (!sagataveLineItem || !projectLineItem) {
    return { sagataveLineItem, projectLineItem };
  }

  if (lineItemsCorrespond(sagataveLineItem, projectLineItem)) {
    return { sagataveLineItem, projectLineItem };
  }

  const matchedProjectOption = projectOptions.find((option) =>
    lineItemsCorrespond(option.lineItem, sagataveLineItem),
  );
  if (matchedProjectOption) {
    return {
      sagataveLineItem,
      projectLineItem: matchedProjectOption.lineItem,
    };
  }

  if (
    sagataveOptions.length === projectOptions.length &&
    sagataveLineItem &&
    projectLineItem
  ) {
    return { sagataveLineItem, projectLineItem };
  }

  return { sagataveLineItem, projectLineItem };
}

/**
 * Atrod projekta multi opciju sagataves opcijai, ja tā vēl nav pāra ar citu.
 */
export function findUnpairedProjectOptionForSagataveOption(
  projectOptions: { id: string; lineItem: EstimateLineItem }[],
  sagataveOption: { id: string; lineItem: EstimateLineItem },
  optionIndex: number,
  sagataveOptions: { id: string; lineItem: EstimateLineItem }[],
  usedProjectOptionIds: ReadonlySet<string>,
): { id: string; lineItem: EstimateLineItem } | undefined {
  const byIndex = projectOptions[optionIndex];
  if (
    byIndex &&
    !usedProjectOptionIds.has(byIndex.id) &&
    lineItemsCorrespond(byIndex.lineItem, sagataveOption.lineItem)
  ) {
    return byIndex;
  }

  const key = lineItemCorrespondenceKey(sagataveOption.lineItem);
  if (key) {
    let occurrence = 0;
    for (let index = 0; index < optionIndex; index++) {
      const previous = sagataveOptions[index];
      if (
        previous &&
        lineItemCorrespondenceKey(previous.lineItem) === key
      ) {
        occurrence++;
      }
    }

    let seen = 0;
    for (const option of projectOptions) {
      if (usedProjectOptionIds.has(option.id)) {
        continue;
      }
      if (lineItemCorrespondenceKey(option.lineItem) !== key) {
        continue;
      }
      if (seen === occurrence) {
        return option;
      }
      seen++;
    }
  }

  for (const option of projectOptions) {
    if (usedProjectOptionIds.has(option.id)) {
      continue;
    }
    if (lineItemsCorrespond(option.lineItem, sagataveOption.lineItem)) {
      return option;
    }
  }

  return undefined;
}
