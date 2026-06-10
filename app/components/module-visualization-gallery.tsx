import type { ModuleContentBlock } from "@/app/lib/modules/types";

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
  return (
    <section className={`flex h-full min-h-[14rem] flex-col ${className}`.trim()}>
      {blocks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-sm text-zinc-500">
          Nav vizualizāciju.
        </p>
      ) : (
        <div className="grid max-h-[min(24rem,50vh)] grid-cols-2 gap-2 overflow-y-auto">
            {blocks.map((block) => (
              <div key={block.id} className={tileClassName}>
                <a
                  href={block.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block size-full"
                  aria-label={`Atvērt attēlu: ${block.title}`}
                >
                  <img
                    src={block.fileUrl}
                    alt=""
                    className="size-full object-cover transition hover:opacity-95"
                  />
                </a>
              </div>
            ))}
          </div>
        )}
    </section>
  );
}
