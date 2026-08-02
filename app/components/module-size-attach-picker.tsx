"use client";

import { useEffect, useMemo, useState } from "react";
import { ModuleSizeAttachItemRow } from "@/app/components/module-size-attach-item-row";
import { useTranslations } from "@/app/components/translations-provider";
import {
  buildAdjustedModuleSizeSummarySections,
  findModuleSizeSummaryItem,
} from "@/app/lib/modules/apply-module-size-adjustments";
import { translateModuleSizeSummarySections } from "@/app/lib/modules/format-module-size-summary";
import type {
  LineItemModuleSizeAttachment,
  ModuleSizeItemSign,
} from "@/app/lib/estimates/types";
import {
  createLineItemModuleSizeAttachment,
  getLineItemModuleSizeItemKeys,
  getLineItemModuleSizeItemMultipliers,
  getLineItemModuleSizeItemSigns,
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

/** Atgriež sadaļu nosaukumus, kuros atrodas kāda no dotajām `itemKeys`. */
function findSectionTitlesForItemKeys(
  sections: { title: string; items: { key: string }[] }[],
  itemKeys: readonly string[],
): string[] {
  if (itemKeys.length === 0) {
    return [];
  }

  return sections
    .filter((section) => section.items.some((item) => itemKeys.includes(item.key)))
    .map((section) => section.title);
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
  showModuleName = true,
  matchAnyModule = false,
}: {
  controlPrefix: string;
  module: BuildingModuleSizeOption;
  attachment: LineItemModuleSizeAttachment | null;
  onChange: (attachment: LineItemModuleSizeAttachment | null) => void;
  /** Sagatavē modulis ir tikai piemērs, tāpēc nosaukumu nerāda. */
  showModuleName?: boolean;
  /** Piesaisti atpazīst pēc atslēgām arī tad, ja tā glabā cita moduļa id. */
  matchAnyModule?: boolean;
}) {
  const { t } = useTranslations();
  const isAttachedModule =
    attachment != null && (matchAnyModule || attachment.moduleId === module.id);
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

  const attachedItemSigns = useMemo(
    () =>
      isAttachedModule && attachment
        ? getLineItemModuleSizeItemSigns(attachment)
        : {},
    [attachment, isAttachedModule],
  );
  const attachedItemMultipliers = useMemo(
    () =>
      isAttachedModule && attachment
        ? getLineItemModuleSizeItemMultipliers(attachment)
        : {},
    [attachment, isAttachedModule],
  );

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

  const attachedSectionTitles = useMemo(
    () =>
      isAttachedModule
        ? findSectionTitlesForItemKeys(module.sections, attachedItemKeys)
        : [],
    [attachedItemKeys, isAttachedModule, module.sections],
  );

  const [openSections, setOpenSections] = useState<string[]>(attachedSectionTitles);

  // Sadaļas ar piesaistītiem elementiem atveras automātiski un paliek atvērtas,
  // kad lietotājs atver vēl kādu citu sadaļu.
  useEffect(() => {
    setOpenSections((current) => {
      const missing = attachedSectionTitles.filter(
        (title) => !current.includes(title),
      );
      return missing.length > 0 ? [...current, ...missing] : current;
    });
  }, [attachedSectionTitles]);

  function toggleSection(title: string) {
    setOpenSections((current) =>
      current.includes(title)
        ? current.filter((entry) => entry !== title)
        : [...current, title],
    );
  }

  if (module.sections.length === 0) {
    return (
      <li className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
        {showModuleName ? (
          <div className="text-sm font-semibold text-zinc-900">{module.name}</div>
        ) : null}
        <p className={`text-sm text-zinc-500${showModuleName ? " mt-2" : ""}`}>
          {t("modules.sizes.empty_for_module", "Nav definētu lielumu šim modulim.")}
        </p>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      {showModuleName ? (
        <div className="text-sm font-semibold text-zinc-900">{module.name}</div>
      ) : null}
      <div className={`space-y-1${showModuleName ? " mt-3" : ""}`}>
        {module.sections.map((section, sectionIndex) => {
          const isOpen = openSections.includes(section.title);
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
                    // Pirmais piesaistītais lielums ir bāze — zīmi rāda tikai nākamajiem.
                    const isBaseAttachedItem = attachedItemKeys[0] === baseItem.key;
                    const quantitySign: ModuleSizeItemSign | undefined =
                      enabled && !isBaseAttachedItem
                        ? (attachedItemSigns[baseItem.key] ?? "+")
                        : undefined;
                    const doubleQuantity =
                      enabled && (attachedItemMultipliers[baseItem.key] ?? 1) >= 2;

                    return (
                      <ModuleSizeAttachItemRow
                        key={baseItem.key}
                        controlId={`${controlPrefix}-${module.id}-${baseItem.key}`}
                        item={displayItem}
                        baseDisplayValue={baseDisplayValue}
                        state={{ enabled, adjustment }}
                        quantitySign={quantitySign}
                        onQuantitySignChange={
                          quantitySign
                            ? (nextSign) => {
                                const nextAttachment =
                                  createLineItemModuleSizeAttachment(
                                    module.id,
                                    attachedItemKeys,
                                    currentAdjustments,
                                    { ...attachedItemSigns, [baseItem.key]: nextSign },
                                    attachedItemMultipliers,
                                  );
                                if (nextAttachment) {
                                  onChange(nextAttachment);
                                }
                              }
                            : undefined
                        }
                        doubleQuantity={doubleQuantity}
                        onDoubleQuantityChange={
                          enabled
                            ? (doubled) => {
                                const nextMultipliers = {
                                  ...attachedItemMultipliers,
                                };
                                if (doubled) {
                                  nextMultipliers[baseItem.key] = 2;
                                } else {
                                  delete nextMultipliers[baseItem.key];
                                }
                                const nextAttachment =
                                  createLineItemModuleSizeAttachment(
                                    module.id,
                                    attachedItemKeys,
                                    currentAdjustments,
                                    attachedItemSigns,
                                    nextMultipliers,
                                  );
                                if (nextAttachment) {
                                  onChange(nextAttachment);
                                }
                              }
                            : undefined
                        }
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
                              attachedItemSigns,
                              attachedItemMultipliers,
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
                            attachedItemSigns,
                            attachedItemMultipliers,
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

  // Sagatavē lielumi ir tikai piemērs — rāda vienu sarakstu bez moduļa nosaukuma.
  const isExample = moduleSizeOptions[0].exampleOnly === true;
  const visibleOptions = isExample
    ? [moduleSizeOptions[0]]
    : moduleSizeOptions;

  return (
    <div className="space-y-3">
      {isExample ? (
        <p className="text-xs text-zinc-500">
          {t(
            "modules.sizes.example_note",
            "Skaitļi šeit ir tikai piemērs no viena moduļa. Katrā tāmē apjoms tiks aprēķināts no tā projekta moduļa lielumiem.",
          )}
        </p>
      ) : null}
      <ul className="space-y-4">
        {visibleOptions.map((module) => (
          <ModuleCard
            key={module.id}
            controlPrefix={controlPrefix}
            module={module}
            attachment={attachment}
            onChange={onChange}
            showModuleName={!isExample}
            matchAnyModule={isExample}
          />
        ))}
      </ul>
    </div>
  );
}
