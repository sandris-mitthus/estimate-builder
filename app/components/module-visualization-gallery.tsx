"use client";

import { useMemo } from "react";
import { resolveModuleBlockAssetUrl } from "@/app/lib/modules/resolve-block-asset";
import type { ModuleContentBlock } from "@/app/lib/modules/types";
import { ModuleVisualizationImage } from "@/app/components/module-visualization-image";
import { useTranslations } from "@/app/components/translations-provider";

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
  const { t } = useTranslations();
  const imageBlocks = useMemo(
    () => blocks.filter((block) => block.mimeType.startsWith("image/")),
    [blocks],
  );

  return (
    <section className={`flex h-full min-h-[14rem] flex-col ${className}`.trim()}>
      {imageBlocks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-sm text-zinc-500">
          {t("modules.visualizations.empty", "Nav vizualizāciju.")}
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
                aria-label={t("files.open_image_named", "Atvērt attēlu: {name}", {
                  name: block.title,
                })}
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
