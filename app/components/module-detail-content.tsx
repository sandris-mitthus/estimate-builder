"use client";

import { ModuleDataEditorPanel } from "@/app/components/module-data-editor-panel";
import type { BuildingModuleDetail } from "@/app/lib/modules/types";

type ModuleDetailContentProps = {
  module: BuildingModuleDetail;
};

export function ModuleDetailContent({ module }: ModuleDetailContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          {module.name}
        </h1>
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
