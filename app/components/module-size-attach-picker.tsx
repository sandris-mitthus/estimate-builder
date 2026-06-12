"use client";

import { useMemo } from "react";
import { ModuleSizeAttachItemRow } from "@/app/components/module-size-attach-item-row";
import {
  buildAdjustedModuleSizeSummarySections,
  findModuleSizeSummaryItem,
} from "@/app/lib/modules/apply-module-size-adjustments";
import type { LineItemModuleSizeAttachment } from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";

type ModuleSizeAttachPickerProps = {
  controlPrefix: string;
  moduleSizeOptions: BuildingModuleSizeOption[];
  attachment: LineItemModuleSizeAttachment | null;
  onChange: (attachment: LineItemModuleSizeAttachment | null) => void;
};

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
  const isAttachedModule = attachment?.moduleId === module.id;
  const adjustments = useMemo(
    () => (isAttachedModule ? attachment?.adjustments ?? {} : {}),
    [attachment?.adjustments, isAttachedModule],
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

  if (module.sections.length === 0) {
    return (
      <li className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
        <div className="text-sm font-semibold text-zinc-900">{module.name}</div>
        <p className="mt-2 text-sm text-zinc-500">
          Nav definētu lielumu šim modulim.
        </p>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      <div className="text-sm font-semibold text-zinc-900">{module.name}</div>
      <div className="mt-3 space-y-4">
        {module.sections.map((section) => (
          <section key={section.title}>
            <h4 className="border-b border-zinc-200 pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-700">
              {section.title}
            </h4>
            <ul className="mt-2 space-y-0.5">
              {section.items.map((baseItem) => {
                const enabled =
                  isAttachedModule && attachment?.itemKey === baseItem.key;
                const displayItem =
                  findModuleSizeSummaryItem(displaySections, baseItem.key) ??
                  baseItem;
                const baseDisplayValue =
                  displayItem.value !== baseItem.value
                    ? baseItem.value
                    : undefined;
                const adjustment = isAttachedModule
                  ? adjustments[baseItem.key] ?? ""
                  : "";

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
                          adjustments: isAttachedModule
                            ? attachment?.adjustments ?? {}
                            : {},
                        });
                        return;
                      }

                      if (enabled) {
                        onChange(null);
                      }
                    }}
                    onAdjustmentChange={(nextAdjustment) => {
                      if (!enabled || !attachment) {
                        return;
                      }

                      const nextAdjustments = {
                        ...(attachment.adjustments ?? {}),
                      };
                      if (nextAdjustment.trim().length > 0) {
                        nextAdjustments[baseItem.key] = nextAdjustment;
                      } else {
                        delete nextAdjustments[baseItem.key];
                      }

                      onChange({ ...attachment, adjustments: nextAdjustments });
                    }}
                  />
                );
              })}
            </ul>
          </section>
        ))}
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
  if (moduleSizeOptions.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Nav definētu moduļa lielumu. Ievadi tos moduļa detaļā sadaļā Projekta
        apraksts.
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
