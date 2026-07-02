import {
  getLineItemModuleSizeAdjustments,
  getLineItemModuleSizeItemKeys,
} from "@/app/lib/estimates/module-size-attachment";
import {
  buildAdjustedModuleSizeSummarySections,
} from "@/app/lib/modules/apply-module-size-adjustments";
import { translateModuleSizeSummarySections } from "@/app/lib/modules/format-module-size-summary";
import type { TranslationParams } from "@/app/lib/i18n/translations";
import type { ModuleSizeSummarySection } from "@/app/lib/modules/module-size-summary-types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { LineItemModuleSizeAttachment } from "@/app/lib/estimates/types";
import { formatAmountDisplay } from "@/app/lib/estimates/calculate-line";

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

function findSummaryItemInSections(
  sections: ModuleSizeSummarySection[],
  itemKey: string,
) {
  for (const section of sections) {
    const item = section.items.find((entry) => entry.key === itemKey);
    if (item) {
      return { section, item };
    }
  }
  return null;
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

  const itemKeys = getLineItemModuleSizeItemKeys(attachment);
  const resolvedItems = itemKeys
    .map((itemKey) => findSummaryItemInSections(sections, itemKey))
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);

  if (resolvedItems.length === 0) {
    return null;
  }

  if (resolvedItems.length === 1) {
    const { section, item } = resolvedItems[0];
    return { sectionTitle: section.title, label: item.label, value: item.value };
  }

  const labels = resolvedItems.map((entry) => entry.item.label);
  const numericValues = resolvedItems
    .map((entry) => entry.item.numericValue)
    .filter((value): value is number => value != null && Number.isFinite(value));
  const units = [
    ...new Set(
      resolvedItems
        .map((entry) => entry.item.unit)
        .filter((unit): unit is string => unit != null && unit.trim().length > 0),
    ),
  ];
  const sectionTitles = [
    ...new Set(resolvedItems.map((entry) => entry.section.title)),
  ];

  const value =
    numericValues.length > 0 && units.length === 1
      ? `${formatAmountDisplay(
          numericValues.reduce((total, current) => total + current, 0),
        )} ${units[0]}`
      : resolvedItems.map((entry) => entry.item.value).join(" + ");

  return {
    sectionTitle:
      sectionTitles.length === 1
        ? sectionTitles[0]
        : t?.("modules.sizes.multiple_sections", "Moduļa lielumi") ??
          "Moduļa lielumi",
    label: labels.join(" + "),
    value,
  };
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

export function formatAttachedModuleSizeFullDisplay(
  attachment: LineItemModuleSizeAttachment,
  moduleSizeOptions: BuildingModuleSizeOption[],
  t?: Translate,
): string | null {
  const detail = resolveAttachedModuleSizeDetail(attachment, moduleSizeOptions, t);
  if (!detail) return null;
  return `${detail.sectionTitle} · ${detail.label} · ${detail.value}`;
}
