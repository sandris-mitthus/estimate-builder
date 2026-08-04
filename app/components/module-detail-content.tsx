"use client";

import { ModuleDataEditorPanel } from "@/app/components/module-data-editor-panel";
import { ModuleMissingDataIcon } from "@/app/components/module-missing-data-icon";
import { isBuildingModuleDataComplete } from "@/app/lib/modules/building-module-data";
import type { BuildingModuleDetail } from "@/app/lib/modules/types";

type ModuleDetailContentProps = {
  module: BuildingModuleDetail;
};

export function ModuleDetailContent({ module }: ModuleDetailContentProps) {
  const moduleDataComplete =
    typeof module.moduleDataComplete === "boolean"
      ? module.moduleDataComplete
      : isBuildingModuleDataComplete(module);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            {module.name}
          </h1>
          {!moduleDataComplete ? <ModuleMissingDataIcon /> : null}
        </div>
        {module.note ? (
          <p className="-mt-0.5 text-[0.7875rem] leading-5 text-zinc-500">
            {module.note}
          </p>
        ) : null}
      </div>

      <ModuleDataEditorPanel
        scope={{ kind: "module", id: module.id }}
        visualizationBlocks={module.visualizationBlocks}
        projectBlocks={module.projectBlocks}
        initialProjectDescription={module.projectDescription}
        showOutline
        outline={module.outline}
      />
    </div>
  );
}
