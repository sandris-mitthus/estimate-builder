"use client";

import { useEffect, useState } from "react";
import { resolveModuleBlockAssetUrl } from "@/app/lib/modules/resolve-block-asset";
import type { ModuleContentBlock } from "@/app/lib/modules/types";

type ModuleVisualizationImageProps = {
  block: ModuleContentBlock;
};

export function ModuleVisualizationImage({ block }: ModuleVisualizationImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const assetUrl = resolveModuleBlockAssetUrl(block);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    setSrc(null);
    setFailed(false);

    async function loadImage() {
      try {
        const response = await fetch(assetUrl, { credentials: "include" });
        if (!response.ok) {
          throw new Error("Failed to load image");
        }

        const blob = await response.blob();
        if (cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    void loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [assetUrl]);

  if (failed) {
    return (
      <div className="flex size-full items-center justify-center bg-zinc-100 text-zinc-400">
        <i className="fas fa-image text-2xl" aria-hidden="true" />
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex size-full items-center justify-center bg-zinc-100 text-zinc-400">
        <i className="fas fa-spinner animate-spin text-lg" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="size-full object-cover transition hover:opacity-95"
    />
  );
}
