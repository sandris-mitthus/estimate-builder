"use client";

import { ModuleDataEditorPanel } from "@/app/components/module-data-editor-panel";
import type { ProjectSummary } from "@/app/lib/projects/types";

type ProjectModuleDataContentProps = {
  project: ProjectSummary;
};

export function ProjectModuleDataContent({ project }: ProjectModuleDataContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          {project.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{project.address}</p>
      </div>

      <ModuleDataEditorPanel
        scope={{ kind: "project", id: project.id }}
        visualizationBlocks={project.visualizationBlocks}
        projectBlocks={project.projectBlocks}
      />
    </div>
  );
}
