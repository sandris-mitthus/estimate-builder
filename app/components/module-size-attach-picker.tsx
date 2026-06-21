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
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";

type ModuleSizeAttachPickerProps = {
  controlPrefix: string;
  moduleSizeOptions: BuildingModuleSizeOption[];
  attachment: LineItemModuleSizeAttachment | null;
  onChange: (attachment: LineItemModuleSizeAttachment | null) => void;
};

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
  }, [isAttachedModule, attachment?.itemKey]);

  const adjustments = isAttachedModule
    ? (attachment?.adjustments ?? {})
    : localAdjustments;

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
      ? findSectionForItemKey(module.sections, attachment?.itemKey)
      : null,
  );

  // Kad mainās piesaistītais modulis vai itemKey — atver attiecīgo sadaļu.
  useEffect(() => {
    setOpenSection(
      isAttachedModule
        ? findSectionForItemKey(module.sections, attachment?.itemKey)
        : null,
    );
  }, [isAttachedModule, attachment?.itemKey, module.sections]);

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
                    const enabled =
                      isAttachedModule && attachment?.itemKey === baseItem.key;
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

                    return (
                      <ModuleSizeAttachItemRow
                        key={baseItem.key}
                        controlId={`${controlPrefix}-${module.id}-${baseItem.key}`}
                        item={displayItem}
                        baseDisplayValue={baseDisplayValue}
                        state={{ enabled, adjustment }}
                        onEnabledChange={(nextEnabled) => {
                          if (nextEnabled) {
                            onChange({
                              moduleId: module.id,
                              itemKey: baseItem.key,
                              // Iekļauj visas lokālās korekcijas, kas ievadītas pirms piesaistīšanas
                              adjustments: isAttachedModule
                                ? (attachment?.adjustments ?? {})
                                : localAdjustments,
                            });
                            return;
                          }

                          if (enabled) {
                            onChange(null);
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
