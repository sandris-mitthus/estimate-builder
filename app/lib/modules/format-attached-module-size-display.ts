import { getLineItemModuleSizeAdjustments } from "@/app/lib/estimates/module-size-attachment";
import {
  buildAdjustedModuleSizeSummarySections,
  findModuleSizeSummaryItem,
} from "@/app/lib/modules/apply-module-size-adjustments";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { LineItemModuleSizeAttachment } from "@/app/lib/estimates/types";

export function formatAttachedModuleSizeDisplay(
  attachment: LineItemModuleSizeAttachment,
  moduleSizeOptions: BuildingModuleSizeOption[],
): string | null {
  const module = moduleSizeOptions.find(
    (entry) => entry.id === attachment.moduleId,
  );
  if (!module) {
    return null;
  }

  const adjustments = getLineItemModuleSizeAdjustments(attachment);

  const sections =
    Object.keys(adjustments).length > 0
      ? buildAdjustedModuleSizeSummarySections(
          module.projectDescription,
          adjustments,
        )
      : module.sections;

  const item = findModuleSizeSummaryItem(sections, attachment.itemKey);
  if (!item) {
    return null;
  }

  return `${item.label} · ${item.value}`;
}
