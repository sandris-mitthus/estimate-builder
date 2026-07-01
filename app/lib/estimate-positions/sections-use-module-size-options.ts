import {
  resolveEffectiveMaterials,
} from "@/app/lib/estimates/composite-line-item";
import { hasMaterialCustomConsumptionVolume } from "@/app/lib/estimates/material-consumption-basis";
import { normalizeLineItemModuleSizeAttachment } from "@/app/lib/estimates/module-size-attachment";
import {
  isEstimateMultiPosition,
} from "@/app/lib/estimates/multi-position";
import type { EstimateLineItem, EstimateRowItem } from "@/app/lib/estimates/types";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";

function lineItemUsesModuleSizeOptions(item: EstimateLineItem): boolean {
  if (normalizeLineItemModuleSizeAttachment(item.moduleSizeAttachment)) {
    return true;
  }

  return resolveEffectiveMaterials(item).some((material) =>
    hasMaterialCustomConsumptionVolume(material),
  );
}

function rowsUseModuleSizeOptions(rows: EstimateRowItem[]): boolean {
  for (const row of rows) {
    if (isEstimateMultiPosition(row)) {
      for (const option of row.options) {
        if (lineItemUsesModuleSizeOptions(option.lineItem)) {
          return true;
        }
      }
      continue;
    }

    if (lineItemUsesModuleSizeOptions(row)) {
      return true;
    }
  }

  return false;
}

export function estimateSectionsUseModuleSizeOptions(
  sections: EstimatePositionSection[],
): boolean {
  for (const section of sections) {
    if (rowsUseModuleSizeOptions(section.items)) {
      return true;
    }

    for (const subcategory of section.subcategories ?? []) {
      if (rowsUseModuleSizeOptions(subcategory.items)) {
        return true;
      }
    }
  }

  return false;
}
