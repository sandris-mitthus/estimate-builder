"use client";

import { resolveModuleBlockAssetUrl } from "@/app/lib/modules/resolve-block-asset";
import type { ModuleContentBlock } from "@/app/lib/modules/types";
import { ModuleVisualizationImage } from "@/app/components/module-visualization-image";

const tileClassName =
  "relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm";

type ModuleVisualizationGalleryProps = {
  blocks: ModuleContentBlock[];
  className?: string;
};

export function ModuleVisualizationGallery({
  blocks,
  className = "",
}: ModuleVisualizationGalleryProps) {
  const imageBlocks = blocks.filter((block) => block.mimeType.startsWith("image/"));

  return (
    <section className={`flex h-full min-h-[14rem] flex-col ${className}`.trim()}>
      {imageBlocks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-sm text-zinc-500">
          Nav vizualizāciju.
        </p>
      ) : (
        <div className="grid max-h-[min(24rem,50vh)] grid-cols-2 gap-2 overflow-y-auto">
          {imageBlocks.map((block) => (
            <div key={block.id} className={tileClassName}>
              <a
                href={resolveModuleBlockAssetUrl(block)}
                target="_blank"
                rel="noopener noreferrer"
                className="block size-full"
                aria-label={`Atvērt attēlu: ${block.title}`}
              >
                <ModuleVisualizationImage block={block} />
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
