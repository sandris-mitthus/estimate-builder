"use client";

import { ModuleFileBlockColumn } from "@/app/components/module-file-block-column";
import { ModuleOutlineView } from "@/app/components/module-outline-view";
import { ModuleProjectDescriptionForm } from "@/app/components/module-project-description-form";
import type {
  ModuleBlockKind,
  ModuleContentBlock,
  ModuleOutline,
} from "@/app/lib/modules/types";

type BlockActionResult =
  | { ok: true; block: ModuleContentBlock }
  | { ok: false; error: string };

type ModuleDataEditorProps = {
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
  uploadBlockAction: (
    kind: ModuleBlockKind,
    formData: FormData,
  ) => Promise<BlockActionResult>;
  removeBlockAction: (
    kind: ModuleBlockKind,
    blockId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onVisualizationReorder: (blocks: ModuleContentBlock[]) => void;
  onProjectReorder: (blocks: ModuleContentBlock[]) => void;
  onVisualizationBlocksChange: (blocks: ModuleContentBlock[]) => void;
  onProjectBlocksChange: (blocks: ModuleContentBlock[]) => void;
  showOutline?: boolean;
  outline?: ModuleOutline;
};

export function ModuleDataEditor({
  visualizationBlocks,
  projectBlocks,
  uploadBlockAction,
  removeBlockAction,
  onVisualizationReorder,
  onProjectReorder,
  onVisualizationBlocksChange,
  onProjectBlocksChange,
  showOutline = false,
  outline,
}: ModuleDataEditorProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <ModuleFileBlockColumn
            title="Vizualizācijas"
            kind="visualization"
            blocks={visualizationBlocks}
            dragLabel="Pārvietot vizualizācijas bloku"
            emptyLabel="Nav vizualizāciju."
            uploadHint="Tikai attēli: PNG, JPG, WEBP, GIF · max 10 MB"
            accept="image/png,image/jpeg,image/webp,image/gif"
            uploadBlockAction={(formData) =>
              uploadBlockAction("visualization", formData)
            }
            removeBlockAction={(blockId) =>
              removeBlockAction("visualization", blockId)
            }
            onReorder={onVisualizationReorder}
            onBlocksChange={onVisualizationBlocksChange}
          />

          <ModuleFileBlockColumn
            title="Projekts"
            kind="project"
            blocks={projectBlocks}
            dragLabel="Pārvietot projekta bloku"
            emptyLabel="Nav projekta failu."
            uploadHint="Tikai PDF faili · max 20 MB"
            accept="application/pdf,.pdf"
            uploadBlockAction={(formData) => uploadBlockAction("project", formData)}
            removeBlockAction={(blockId) => removeBlockAction("project", blockId)}
            onReorder={onProjectReorder}
            onBlocksChange={onProjectBlocksChange}
          />
        </div>

        <ModuleProjectDescriptionForm />
      </div>

      {showOutline && outline ? <ModuleOutlineView outline={outline} /> : null}
    </div>
  );
}
