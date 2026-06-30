"use client";

import { useEffect, useState } from "react";
import { resolveModuleBlockAssetUrl } from "@/app/lib/modules/resolve-block-asset";
import type { ModuleContentBlock } from "@/app/lib/modules/types";

type ModuleVisualizationImageProps = {
  block: ModuleContentBlock;
};

export function ModuleVisualizationImage({ block }: ModuleVisualizationImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const assetUrl = resolveModuleBlockAssetUrl(block);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [assetUrl]);

  if (failed) {
    return (
      <div className="flex size-full items-center justify-center bg-zinc-100 text-zinc-400">
        <i className="fas fa-image text-2xl" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="relative size-full bg-zinc-100">
      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
          <i className="fas fa-spinner animate-spin text-lg" aria-hidden="true" />
        </div>
      ) : null}
      <img
        src={assetUrl}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`size-full object-cover transition hover:opacity-95 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
