import {
  getLineItemModuleSizeAdjustments,
  getLineItemModuleSizeItemKeys,
  getLineItemModuleSizeItemMultiplier,
  getLineItemModuleSizeItemSign,
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

/** Savieno vairāku piesaistīto lielumu tekstus ar to zīmēm: "A + B - C". */
function joinWithSigns(
  parts: string[],
  entries: { sign: "+" | "-" }[],
): string {
  return parts
    .map((part, index) =>
      index === 0 ? part : `${entries[index].sign} ${part}`,
    )
    .join(" ");
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
    .map((itemKey) => {
      const found = findSummaryItemInSections(sections, itemKey);
      return found
        ? {
            ...found,
            sign: getLineItemModuleSizeItemSign(attachment, itemKey),
            multiplier: getLineItemModuleSizeItemMultiplier(attachment, itemKey),
          }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);

  if (resolvedItems.length === 0) {
    return null;
  }

  function formatItemLabel(label: string, multiplier: number): string {
    return multiplier > 1 ? `${label} ×${multiplier}` : label;
  }

  if (resolvedItems.length === 1) {
    const { section, item, multiplier } = resolvedItems[0];
    const value =
      item.numericValue != null &&
      Number.isFinite(item.numericValue) &&
      multiplier > 1 &&
      item.unit
        ? `${formatAmountDisplay(item.numericValue * multiplier)} ${item.unit}`
        : item.value;
    return {
      sectionTitle: section.title,
      label: formatItemLabel(item.label, multiplier),
      value,
    };
  }

  const signedNumericValues = resolvedItems
    .map((entry) =>
      entry.item.numericValue != null && Number.isFinite(entry.item.numericValue)
        ? (entry.sign === "-" ? -1 : 1) * entry.item.numericValue * entry.multiplier
        : null,
    )
    .filter((value): value is number => value != null);
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
    signedNumericValues.length > 0 && units.length === 1
      ? `${formatAmountDisplay(
          signedNumericValues.reduce((total, current) => total + current, 0),
        )} ${units[0]}`
      : joinWithSigns(
          resolvedItems.map((entry) =>
            formatItemLabel(entry.item.value, entry.multiplier),
          ),
          resolvedItems,
        );

  return {
    sectionTitle:
      sectionTitles.length === 1
        ? sectionTitles[0]
        : t?.("modules.sizes.multiple_sections", "Moduļa lielumi") ??
          "Moduļa lielumi",
    label: joinWithSigns(
      resolvedItems.map((entry) =>
        formatItemLabel(entry.item.label, entry.multiplier),
      ),
      resolvedItems,
    ),
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
