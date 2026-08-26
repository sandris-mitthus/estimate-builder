import { cloneMultiOption } from "@/app/lib/estimate-positions/clone-sagatave-for-project";
import {
  collectEstimateMultisByLabel,
  getNormalizedMultiLabel,
  lineItemCorrespondenceKey,
  lineItemsCorrespond,
  unionMultiOptionsPreferringPrimary,
} from "@/app/lib/estimate-positions/sagatave-row-matching";
import { isEstimateMultiPosition } from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateMultiPosition,
  EstimateRowItem,
} from "@/app/lib/estimates/types";

function collectAllMultis(sections: EstimateCategory[]): EstimateMultiPosition[] {
  const found: EstimateMultiPosition[] = [];

  const visit = (items: EstimateRowItem[]) => {
    for (const row of items) {
      if (isEstimateMultiPosition(row)) {
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

function multiHasOption(
  multi: EstimateMultiPosition,
  template: EstimateMultiPosition["options"][number],
): boolean {
  const key = lineItemCorrespondenceKey(template.lineItem);
  return multi.options.some((option) => {
    if (key) {
      return lineItemCorrespondenceKey(option.lineItem) === key;
    }
    return lineItemsCorrespond(option.lineItem, template.lineItem);
  });
}

/**
 * Sagatavē (un citur) vienādi nosauktām multi-pozīcijām pielīdzina opciju kopu:
 * ja vienā „Extra karkass” ir jauna opcija, pārējās ar to pašu nosaukumu to arī saņem.
 */
export function propagateSameNamedMultiOptions(
  sections: EstimateCategory[],
): EstimateCategory[] {
  const next = structuredClone(sections);
  const allMultis = collectAllMultis(next);
  const labels = new Set(allMultis.map((multi) => getNormalizedMultiLabel(multi)));

  for (const label of labels) {
    const group = collectEstimateMultisByLabel(next, label);
    if (group.length < 2) {
      continue;
    }

    const primary = group.reduce((richest, multi) =>
      multi.options.length > richest.options.length ? multi : richest,
    );
    const union = unionMultiOptionsPreferringPrimary(primary, group);

    for (const multi of group) {
      for (const template of union) {
        if (multiHasOption(multi, template)) {
          continue;
        }
        multi.options.push(cloneMultiOption(template, new Map()));
      }
    }
  }

  return next;
}
