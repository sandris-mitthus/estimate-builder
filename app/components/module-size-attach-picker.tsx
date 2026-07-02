"use client";

import { useEffect, useMemo, useState } from "react";
import { ModuleSizeAttachItemRow } from "@/app/components/module-size-attach-item-row";
import { useTranslations } from "@/app/components/translations-provider";
import {
  buildAdjustedModuleSizeSummarySections,
  findModuleSizeSummaryItem,
} from "@/app/lib/modules/apply-module-size-adjustments";
import { translateModuleSizeSummarySections } from "@/app/lib/modules/format-module-size-summary";
import type { LineItemModuleSizeAttachment } from "@/app/lib/estimates/types";
import {
  createLineItemModuleSizeAttachment,
  getLineItemModuleSizeItemKeys,
} from "@/app/lib/estimates/module-size-attachment";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { ModuleSizeSummaryItem } from "@/app/lib/modules/module-size-summary-types";

type ModuleSizeAttachPickerProps = {
  controlPrefix: string;
  moduleSizeOptions: BuildingModuleSizeOption[];
  attachment: LineItemModuleSizeAttachment | null;
  onChange: (attachment: LineItemModuleSizeAttachment | null) => void;
};

const EMPTY_ATTACHED_ITEM_KEYS: string[] = [];

/** Atgriež sadaļas nosaukumu, kurā atrodas dotais `itemKey`, vai `null`. */
function findSectionForItemKey(
  sections: { title: string; items: { key: string }[] }[],
  itemKey: string | undefined,
): string | null {
  if (!itemKey) return null;
  for (const section of sections) {
    if (section.items.some((item) => item.key === itemKey)) {
      return section.title;
    }
  }
  return null;
}

function findBaseSummaryItem(
  module: BuildingModuleSizeOption,
  itemKey: string,
): ModuleSizeSummaryItem | null {
  for (const section of module.sections) {
    const item = section.items.find((entry) => entry.key === itemKey);
    if (item) {
      return item;
    }
  }
  return null;
}

function ModuleCard({
  controlPrefix,
  module,
  attachment,
  onChange,
}: {
  controlPrefix: string;
  module: BuildingModuleSizeOption;
  attachment: LineItemModuleSizeAttachment | null;
  onChange: (attachment: LineItemModuleSizeAttachment | null) => void;
}) {
  const { t } = useTranslations();
  const isAttachedModule = attachment?.moduleId === module.id;
  const attachedKeysSignature =
    isAttachedModule && attachment
      ? getLineItemModuleSizeItemKeys(attachment).join(",")
      : "";
  const attachedItemKeys = useMemo(() => {
    if (!attachedKeysSignature) {
      return EMPTY_ATTACHED_ITEM_KEYS;
    }
    return attachedKeysSignature.split(",");
  }, [attachedKeysSignature]);

  // Lokālais korekciju stāvoklis — darbojas arī pirms kāda elementa piesaistīšanas.
  const [localAdjustments, setLocalAdjustments] = useState<Record<string, string>>(
    () => (isAttachedModule ? (attachment?.adjustments ?? {}) : {}),
  );

  // Kad mainās piesaistītais elements (vai modulis kļūst piesaistīts/atbrīvots),
  // sinhronizē lokālos datus no attachment — bet NE ik reizi, kad mainās adjustments
  // (tas izraisītu cilpu).
  useEffect(() => {
    if (isAttachedModule) {
      setLocalAdjustments(attachment?.adjustments ?? {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAttachedModule, attachment?.itemKeys, attachment?.itemKey]);

  const adjustments = useMemo(
    () =>
      isAttachedModule
        ? (attachment?.adjustments ?? {})
        : localAdjustments,
    [attachment?.adjustments, isAttachedModule, localAdjustments],
  );

  const displaySections = useMemo(() => {
    if (Object.keys(adjustments).length === 0) {
      return module.sections;
    }

    return buildAdjustedModuleSizeSummarySections(
      module.projectDescription,
      adjustments,
    );
  }, [adjustments, module]);
  const translatedBaseSections = useMemo(
    () => translateModuleSizeSummarySections(module.sections, t),
    [module.sections, t],
  );
  const translatedDisplaySections = useMemo(
    () => translateModuleSizeSummarySections(displaySections, t),
    [displaySections, t],
  );

  const [openSection, setOpenSection] = useState<string | null>(() =>
    isAttachedModule
      ? findSectionForItemKey(module.sections, attachedItemKeys[0])
      : null,
  );

  // Kad mainās piesaistītais modulis vai atslēgas — atver attiecīgo sadaļu.
  useEffect(() => {
    if (!isAttachedModule) {
      return;
    }
    setOpenSection(
      findSectionForItemKey(module.sections, attachedItemKeys[0]),
    );
  }, [attachedItemKeys, isAttachedModule, module.sections]);

  function toggleSection(title: string) {
    setOpenSection((current) => (current === title ? null : title));
  }

  if (module.sections.length === 0) {
    return (
      <li className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
        <div className="text-sm font-semibold text-zinc-900">{module.name}</div>
        <p className="mt-2 text-sm text-zinc-500">
          {t("modules.sizes.empty_for_module", "Nav definētu lielumu šim modulim.")}
        </p>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      <div className="text-sm font-semibold text-zinc-900">{module.name}</div>
      <div className="mt-3 space-y-1">
        {module.sections.map((section, sectionIndex) => {
          const isOpen = openSection === section.title;
          const translatedSection = translatedBaseSections[sectionIndex] ?? section;
          return (
            <section key={section.title}>
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between border-b border-zinc-200 pb-1.5 pt-2 text-left"
              >
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  {translatedSection.title}
                </h4>
                <i
                  className={`fas ${isOpen ? "fa-chevron-up" : "fa-chevron-down"} text-xs text-zinc-400 transition-transform`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <ul className="mt-2 space-y-0.5">
                  {section.items.map((baseItem, index) => {
                    const enabled = attachedItemKeys.includes(baseItem.key);
                      const translatedBaseItem =
                        translatedSection.items[index] ?? baseItem;
                      const displayItem =
                        findModuleSizeSummaryItem(translatedDisplaySections, baseItem.key) ??
                        translatedBaseItem;
                    const baseDisplayValue =
                      displayItem.value !== baseItem.value
                        ? baseItem.value
                        : undefined;
                    const adjustment = localAdjustments[baseItem.key] ?? "";
                    const currentAdjustments = isAttachedModule
                      ? (attachment?.adjustments ?? {})
                      : localAdjustments;

                    return (
                      <ModuleSizeAttachItemRow
                        key={baseItem.key}
                        controlId={`${controlPrefix}-${module.id}-${baseItem.key}`}
                        item={displayItem}
                        baseDisplayValue={baseDisplayValue}
                        state={{ enabled, adjustment }}
                        onEnabledChange={(nextEnabled) => {
                          if (nextEnabled) {
                            const currentKeys = isAttachedModule
                              ? attachedItemKeys
                              : [];
                            const toggledUnit =
                              findBaseSummaryItem(module, baseItem.key)?.unit ?? null;
                            const existingUnit =
                              currentKeys.length > 0
                                ? (findBaseSummaryItem(module, currentKeys[0])?.unit ??
                                  null)
                                : null;

                            let nextKeys: string[];
                            if (
                              currentKeys.length > 0 &&
                              toggledUnit &&
                              existingUnit &&
                              toggledUnit !== existingUnit
                            ) {
                              nextKeys = [baseItem.key];
                            } else if (currentKeys.includes(baseItem.key)) {
                              nextKeys = currentKeys;
                            } else {
                              nextKeys = [...currentKeys, baseItem.key];
                            }

                            const nextAttachment = createLineItemModuleSizeAttachment(
                              module.id,
                              nextKeys,
                              currentAdjustments,
                            );
                            if (nextAttachment) {
                              onChange(nextAttachment);
                            }
                            return;
                          }

                          if (!enabled) {
                            return;
                          }

                          const nextKeys = attachedItemKeys.filter(
                            (key) => key !== baseItem.key,
                          );
                          if (nextKeys.length === 0) {
                            onChange(null);
                            return;
                          }

                          const nextAttachment = createLineItemModuleSizeAttachment(
                            module.id,
                            nextKeys,
                            currentAdjustments,
                          );
                          if (nextAttachment) {
                            onChange(nextAttachment);
                          }
                        }}
                        onAdjustmentChange={(nextAdjustment) => {
                          const nextAdjustments = { ...localAdjustments };
                          if (nextAdjustment.trim().length > 0) {
                            nextAdjustments[baseItem.key] = nextAdjustment;
                          } else {
                            delete nextAdjustments[baseItem.key];
                          }

                          // Vienmēr atjaunina lokālo stāvokli
                          setLocalAdjustments(nextAdjustments);

                          // Ja modulis jau ir piesaistīts — arī propagē uz augšu
                          if (isAttachedModule && attachment) {
                            onChange({ ...attachment, adjustments: nextAdjustments });
                          }
                        }}
                      />
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </li>
  );
}

export function ModuleSizeAttachPicker({
  controlPrefix,
  moduleSizeOptions,
  attachment,
  onChange,
}: ModuleSizeAttachPickerProps) {
  const { t } = useTranslations();

  if (moduleSizeOptions.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        {t(
          "modules.sizes.empty_description",
          "Nav definētu moduļa lielumu. Ievadi tos moduļa detaļā sadaļā Projekta apraksts.",
        )}
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {moduleSizeOptions.map((module) => (
        <ModuleCard
          key={module.id}
          controlPrefix={controlPrefix}
          module={module}
          attachment={attachment}
          onChange={onChange}
        />
      ))}
    </ul>
  );
}
