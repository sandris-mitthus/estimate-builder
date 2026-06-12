import { getLineItemModuleSizeAdjustments } from "@/app/lib/estimates/module-size-attachment";
import {
  buildAdjustedModuleSizeSummarySections,
} from "@/app/lib/modules/apply-module-size-adjustments";
import type { ModuleSizeSummarySection } from "@/app/lib/modules/module-size-summary-types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { LineItemModuleSizeAttachment } from "@/app/lib/estimates/types";

export type AttachedModuleSizeDetail = {
  sectionTitle: string;
  label: string;
  value: string;
};

function resolveAttachmentSections(
  attachment: LineItemModuleSizeAttachment,
  moduleSizeOptions: BuildingModuleSizeOption[],
): { sections: ModuleSizeSummarySection[] } | null {
  const module = moduleSizeOptions.find(
    (entry) => entry.id === attachment.moduleId,
  );
  if (!module) return null;

  const adjustments = getLineItemModuleSizeAdjustments(attachment);
  const sections =
    Object.keys(adjustments).length > 0
      ? buildAdjustedModuleSizeSummarySections(
          module.projectDescription,
          adjustments,
        )
      : module.sections;

  return { sections };
}

export function resolveAttachedModuleSizeDetail(
  attachment: LineItemModuleSizeAttachment,
  moduleSizeOptions: BuildingModuleSizeOption[],
): AttachedModuleSizeDetail | null {
  const result = resolveAttachmentSections(attachment, moduleSizeOptions);
  if (!result) return null;

  for (const section of result.sections) {
    const item = section.items.find((entry) => entry.key === attachment.itemKey);
    if (item) {
      return { sectionTitle: section.title, label: item.label, value: item.value };
    }
  }
  return null;
}

export function formatAttachedModuleSizeDisplay(
  attachment: LineItemModuleSizeAttachment,
  moduleSizeOptions: BuildingModuleSizeOption[],
): string | null {
  const detail = resolveAttachedModuleSizeDetail(attachment, moduleSizeOptions);
  if (!detail) return null;
  return `${detail.label} · ${detail.value}`;
}
