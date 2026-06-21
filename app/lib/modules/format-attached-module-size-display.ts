import { getLineItemModuleSizeAdjustments } from "@/app/lib/estimates/module-size-attachment";
import {
  buildAdjustedModuleSizeSummarySections,
} from "@/app/lib/modules/apply-module-size-adjustments";
import { translateModuleSizeSummarySections } from "@/app/lib/modules/format-module-size-summary";
import type { TranslationParams } from "@/app/lib/i18n/translations";
import type { ModuleSizeSummarySection } from "@/app/lib/modules/module-size-summary-types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { LineItemModuleSizeAttachment } from "@/app/lib/estimates/types";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export type AttachedModuleSizeDetail = {
  sectionTitle: string;
  label: string;
  value: string;
};

function resolveAttachmentSections(
  attachment: LineItemModuleSizeAttachment,
  moduleSizeOptions: BuildingModuleSizeOption[],
): { sections: ModuleSizeSummarySection[] } | null {
  const mod = moduleSizeOptions.find(
    (entry) => entry.id === attachment.moduleId,
  );
  if (!mod) return null;

  const adjustments = getLineItemModuleSizeAdjustments(attachment);
  const sections =
    Object.keys(adjustments).length > 0
      ? buildAdjustedModuleSizeSummarySections(
          mod.projectDescription,
          adjustments,
        )
      : mod.sections;

  return { sections };
}

export function resolveAttachedModuleSizeDetail(
  attachment: LineItemModuleSizeAttachment,
  moduleSizeOptions: BuildingModuleSizeOption[],
  t?: Translate,
): AttachedModuleSizeDetail | null {
  const result = resolveAttachmentSections(attachment, moduleSizeOptions);
  if (!result) return null;

  const sections = t
    ? translateModuleSizeSummarySections(result.sections, t)
    : result.sections;

  for (const section of sections) {
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
  t?: Translate,
): string | null {
  const detail = resolveAttachedModuleSizeDetail(attachment, moduleSizeOptions, t);
  if (!detail) return null;
  return `${detail.label} · ${detail.value}`;
}
