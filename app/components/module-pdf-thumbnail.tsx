"use client";

import { useEffect, useRef, useState } from "react";

type ModulePdfThumbnailProps = {
  storagePath: string;
};

type PreviewStatus = "loading" | "canvas" | "embed" | "failed";

let pdfWorkerConfigured = false;

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.min.mjs");

  if (!pdfWorkerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    pdfWorkerConfigured = true;
  }

  return pdfjs;
}

async function waitForWidth(element: HTMLElement, attempts = 30): Promise<number> {
  for (let index = 0; index < attempts; index += 1) {
    const width = element.clientWidth;
    if (width > 0) return width;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  return element.clientWidth;
}

export function ModulePdfThumbnail({ storagePath }: ModulePdfThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<PreviewStatus>("loading");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    let renderTask: { cancel?: () => void } | null = null;

    async function renderPreview() {
      setStatus("loading");
      setEmbedUrl(null);

      try {
        const response = await fetch(
          `/api/modules/asset?path=${encodeURIComponent(storagePath)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to load PDF");
        }

        const data = await response.arrayBuffer();
        if (cancelled) return;

        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({
          data,
          useSystemFonts: true,
          disableFontFace: true,
        }).promise;

        const page = await pdf.getPage(1);
        const containerEl = containerRef.current;
        if (!containerEl) {
          throw new Error("Container missing");
        }

        const width = await waitForWidth(containerEl);
        if (cancelled || width < 1) return;

        const canvasEl = canvasRef.current;
        if (!canvasEl) {
          throw new Error("Canvas missing");
        }

        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.max(width / viewport.width, width / viewport.height);
        const scaledViewport = page.getViewport({ scale });
        const context = canvasEl.getContext("2d");

        if (!context) {
          throw new Error("Canvas context missing");
        }

        canvasEl.width = scaledViewport.width;
        canvasEl.height = scaledViewport.height;

        const task = page.render({
          canvas: canvasEl,
          canvasContext: context,
          viewport: scaledViewport,
        });

        renderTask = task;
        await task.promise;

        if (!cancelled) {
          setStatus("canvas");
        }
      } catch {
        if (cancelled) return;

        try {
          const response = await fetch(
            `/api/modules/asset?path=${encodeURIComponent(storagePath)}`,
          );

          if (!response.ok) {
            throw new Error("Failed to load PDF");
          }

          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);

          if (!cancelled) {
            setEmbedUrl(objectUrl);
            setStatus("embed");
          }
        } catch {
          if (!cancelled) {
            setStatus("failed");
          }
        }
      }
    }

    void renderPreview();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [storagePath]);

  return (
    <div ref={containerRef} className="relative size-full overflow-hidden bg-white">
      {status === "failed" ? (
        <div className="flex size-full items-center justify-center">
          <i className="fas fa-file-pdf text-4xl text-red-600" aria-hidden="true" />
        </div>
      ) : null}

      {status === "embed" && embedUrl ? (
        <embed
          src={`${embedUrl}#page=1&view=FitH`}
          type="application/pdf"
          className="pointer-events-none size-full"
          aria-label="PDF priekšskatījums"
        />
      ) : null}

      {status === "loading" || status === "canvas" ? (
        <>
          <canvas
            ref={canvasRef}
            className={`absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 transition-opacity ${
              status === "canvas" ? "opacity-100" : "opacity-0"
            }`}
          />
          {status === "loading" ? (
            <div className="absolute inset-0 animate-pulse bg-zinc-100" aria-hidden="true" />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
