"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  removeBuildingModuleBlockAction,
  updateBuildingModuleBlocksAction,
  uploadBuildingModuleBlockAction,
} from "@/app/(protected)/modules/actions";
import {
  removeProjectModuleBlockAction,
  updateProjectModuleBlocksAction,
  uploadProjectModuleBlockAction,
} from "@/app/(protected)/project-module-actions";
import { ModuleDataEditor } from "@/app/components/module-data-editor";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import type {
  ModuleBlockKind,
  ModuleContentBlock,
  ModuleOutline,
} from "@/app/lib/modules/types";

type ModuleDataEditorScope = {
  kind: "module";
  id: string;
};

type ProjectModuleDataEditorScope = {
  kind: "project";
  id: string;
};

type ModuleDataEditorPanelProps = {
  scope: ModuleDataEditorScope | ProjectModuleDataEditorScope;
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
  showOutline?: boolean;
  outline?: ModuleOutline;
};

export function ModuleDataEditorPanel({
  scope,
  visualizationBlocks: initialVisualizationBlocks,
  projectBlocks: initialProjectBlocks,
  showOutline = false,
  outline,
}: ModuleDataEditorPanelProps) {
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const [visualizationBlocks, setVisualizationBlocks] = useState(
    initialVisualizationBlocks,
  );
  const [projectBlocks, setProjectBlocks] = useState(initialProjectBlocks);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setVisualizationBlocks(initialVisualizationBlocks);
    setProjectBlocks(initialProjectBlocks);
  }, [initialProjectBlocks, initialVisualizationBlocks]);

  function persistBlocks(
    nextVisualizationBlocks: ModuleContentBlock[],
    nextProjectBlocks: ModuleContentBlock[],
  ) {
    startTransition(async () => {
      const result =
        scope.kind === "module"
          ? await updateBuildingModuleBlocksAction({
              id: scope.id,
              visualizationBlocks: nextVisualizationBlocks,
              projectBlocks: nextProjectBlocks,
            })
          : await updateProjectModuleBlocksAction({
              id: scope.id,
              visualizationBlocks: nextVisualizationBlocks,
              projectBlocks: nextProjectBlocks,
            });

      if (!result.ok) {
        setVisualizationBlocks(initialVisualizationBlocks);
        setProjectBlocks(initialProjectBlocks);
        showFeedback({ type: "error", text: result.error });
        return;
      }

      router.refresh();
    });
  }

  async function uploadBlock(kind: ModuleBlockKind, formData: FormData) {
    if (scope.kind === "module") {
      return uploadBuildingModuleBlockAction(scope.id, kind, formData);
    }

    return uploadProjectModuleBlockAction(scope.id, kind, formData);
  }

  async function removeBlock(kind: ModuleBlockKind, blockId: string) {
    if (scope.kind === "module") {
      return removeBuildingModuleBlockAction(scope.id, kind, blockId);
    }

    return removeProjectModuleBlockAction(scope.id, kind, blockId);
  }

  function handleVisualizationReorder(nextBlocks: ModuleContentBlock[]) {
    setVisualizationBlocks(nextBlocks);
    persistBlocks(nextBlocks, projectBlocks);
  }

  function handleProjectReorder(nextBlocks: ModuleContentBlock[]) {
    setProjectBlocks(nextBlocks);
    persistBlocks(visualizationBlocks, nextBlocks);
  }

  return (
    <ModuleDataEditor
      uploadBlockAction={uploadBlock}
      removeBlockAction={removeBlock}
      visualizationBlocks={visualizationBlocks}
      projectBlocks={projectBlocks}
      onVisualizationReorder={handleVisualizationReorder}
      onProjectReorder={handleProjectReorder}
      onVisualizationBlocksChange={setVisualizationBlocks}
      onProjectBlocksChange={setProjectBlocks}
      showOutline={showOutline}
      outline={outline}
    />
  );
}
