"use client";



import { useMemo } from "react";

import {

  AppModal,

  appModalExtraWidePanelMaxWidthClassName,

} from "@/app/components/app-modal";

import { ModuleSizeAttachItemRow } from "@/app/components/module-size-attach-item-row";
import { useTranslations } from "@/app/components/translations-provider";

import {

  buildAdjustedModuleSizeSummarySections,

  collectModuleSizeAdjustmentsFromAttachState,

  findModuleSizeSummaryItem,

} from "@/app/lib/modules/apply-module-size-adjustments";
import { translateModuleSizeSummarySections } from "@/app/lib/modules/format-module-size-summary";

import {

  createAttachItemStateKey,

  defaultModuleSizeAttachItemState,

  type ModuleSizeAttachItemState,

} from "@/app/lib/estimates/module-size-attachment";

import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";



type AttachModuleSizeModalProps = {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  lineItemId: string;

  positionName: string;

  moduleSizeOptions: BuildingModuleSizeOption[];

  attachState: Record<string, ModuleSizeAttachItemState>;

  onAttachStateChange: (

    stateKey: string,

    patch: Partial<ModuleSizeAttachItemState>,

  ) => void;

};



function ModuleSizeSectionList({

  lineItemId,

  moduleId,

  baseSections,

  displaySections,

  attachState,

  onItemStateChange,

}: {

  lineItemId: string;

  moduleId: string;

  baseSections: BuildingModuleSizeOption["sections"];

  displaySections: BuildingModuleSizeOption["sections"];

  attachState: Record<string, ModuleSizeAttachItemState>;

  onItemStateChange: (

    stateKey: string,

    patch: Partial<ModuleSizeAttachItemState>,

  ) => void;

}) {
  const { t } = useTranslations();
  const translatedBaseSections = useMemo(
    () => translateModuleSizeSummarySections(baseSections, t),
    [baseSections, t],
  );
  const translatedDisplaySections = useMemo(
    () => translateModuleSizeSummarySections(displaySections, t),
    [displaySections, t],
  );

  if (baseSections.length === 0) {

    return (

      <p className="text-sm text-zinc-500">
        {t("modules.sizes.empty_for_module", "Nav definētu lielumu šim modulim.")}
      </p>

    );

  }



  return (

    <div className="space-y-4">

      {baseSections.map((section, sectionIndex) => {
        const translatedSection = translatedBaseSections[sectionIndex] ?? section;
        return (

          <section key={section.title}>

            <h4 className="border-b border-zinc-200 pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-700">

              {translatedSection.title}

            </h4>

            <ul className="mt-2 space-y-0.5">

              {section.items.map((baseItem, index) => {

                const stateKey = createAttachItemStateKey(moduleId, baseItem.key);

                const itemState =

                  attachState[stateKey] ?? defaultModuleSizeAttachItemState;

                const displayItem =

                  findModuleSizeSummaryItem(translatedDisplaySections, baseItem.key) ??

                  translatedSection.items[index] ??

                  baseItem;

                const baseDisplayValue =

                  displayItem.value !== baseItem.value ? baseItem.value : undefined;



                return (

                  <ModuleSizeAttachItemRow

                    key={stateKey}

                    controlId={`attach-${lineItemId}-${stateKey}`}

                    item={displayItem}

                    baseDisplayValue={baseDisplayValue}

                    state={itemState}

                    onEnabledChange={(enabled) =>

                      onItemStateChange(stateKey, { enabled })

                    }

                    onAdjustmentChange={(adjustment) =>

                      onItemStateChange(stateKey, { adjustment })

                    }

                  />

                );

              })}

            </ul>

          </section>

        );

      })}

    </div>

  );

}



function ModuleSizeOptionCard({

  lineItemId,

  module,

  attachState,

  onItemStateChange,

}: {

  lineItemId: string;

  module: BuildingModuleSizeOption;

  attachState: Record<string, ModuleSizeAttachItemState>;

  onItemStateChange: (

    stateKey: string,

    patch: Partial<ModuleSizeAttachItemState>,

  ) => void;

}) {

  const displaySections = useMemo(() => {

    const adjustments = collectModuleSizeAdjustmentsFromAttachState(

      module.id,

      attachState,

    );



    if (Object.keys(adjustments).length === 0) {

      return module.sections;

    }



    return buildAdjustedModuleSizeSummarySections(

      module.projectDescription,

      adjustments,

    );

  }, [attachState, module]);



  return (

    <li className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">

      <div className="text-sm font-semibold text-zinc-900">{module.name}</div>

      <div className="mt-3">

        <ModuleSizeSectionList

          lineItemId={lineItemId}

          moduleId={module.id}

          baseSections={module.sections}

          displaySections={displaySections}

          attachState={attachState}

          onItemStateChange={onItemStateChange}

        />

      </div>

    </li>

  );

}



export function AttachModuleSizeModal({

  open,

  onOpenChange,

  lineItemId,

  positionName,

  moduleSizeOptions,

  attachState,

  onAttachStateChange,

}: AttachModuleSizeModalProps) {
  const { t } = useTranslations();

  const description = positionName.trim()

    ? t("positions.description_prefix", "Pozīcija: {name}", {
        name: positionName.trim(),
      })

    : undefined;



  return (

    <AppModal

      open={open}

      onOpenChange={onOpenChange}

      title={t("modules.sizes.attach_title", "Piesaisīt moduļa lielumu")}

      description={description}

      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}

    >

      {moduleSizeOptions.length === 0 ? (

        <p className="text-sm text-zinc-500">

          {t(
            "modules.sizes.empty_description",
            "Nav definētu moduļa lielumu. Ievadi tos moduļa detaļā sadaļā Projekta apraksts.",
          )}

        </p>

      ) : (

        <ul className="space-y-4">

          {moduleSizeOptions.map((module) => (

            <ModuleSizeOptionCard

              key={module.id}

              lineItemId={lineItemId}

              module={module}

              attachState={attachState}

              onItemStateChange={onAttachStateChange}

            />

          ))}

        </ul>

      )}

    </AppModal>

  );

}

