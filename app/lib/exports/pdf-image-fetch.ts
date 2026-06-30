import { downloadCompanyLogoFile } from "@/app/lib/settings/logo-storage";
import { MODULE_ASSETS_BUCKET } from "@/app/lib/modules/file-storage";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import type { ModuleContentBlock } from "@/app/lib/modules/types";

export type PdfImageAsset = { dataUrl: string };

const MAX_PDF_VISUALIZATION_IMAGES = 8;
const MAX_PDF_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_TOTAL_IMAGE_BYTES = 20 * 1024 * 1024;
const PDF_IMAGE_FETCH_CONCURRENCY = 3;

function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function fetchLogoAsset(): Promise<PdfImageAsset | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const logo = await downloadCompanyLogoFile(supabase);
  if (!logo) return null;

  const buffer = Buffer.from(await logo.data.arrayBuffer());
  const mimeType = logo.mimeType;

  return { dataUrl: toDataUrl(buffer, mimeType) };
}

export async function fetchVisualizationImages(
  blocks: ModuleContentBlock[],
): Promise<PdfImageAsset[]> {
  if (!isSupabaseAdminConfigured() || blocks.length === 0) return [];

  const supabase = createAdminClient();
  const imageBlocks = blocks
    .filter((b) => b.mimeType.startsWith("image/"))
    .slice(0, MAX_PDF_VISUALIZATION_IMAGES);
  const results: Array<PdfImageAsset | null> = new Array(imageBlocks.length).fill(
    null,
  );
  let totalBytes = 0;
  let nextIndex = 0;

  async function fetchNextImage(): Promise<void> {
    const index = nextIndex;
    nextIndex += 1;

    if (index >= imageBlocks.length || totalBytes >= MAX_PDF_TOTAL_IMAGE_BYTES) {
      return;
    }

    const block = imageBlocks[index];
    const { data, error } = await supabase.storage
      .from(MODULE_ASSETS_BUCKET)
      .download(block.storagePath);

    if (!error && data && data.size <= MAX_PDF_IMAGE_BYTES) {
      const nextTotal = totalBytes + data.size;
      if (nextTotal <= MAX_PDF_TOTAL_IMAGE_BYTES) {
        totalBytes = nextTotal;
        const buffer = Buffer.from(await data.arrayBuffer());
        results[index] = { dataUrl: toDataUrl(buffer, block.mimeType) };
      }
    }

    await fetchNextImage();
  }

  await Promise.all(
    Array.from({
      length: Math.min(PDF_IMAGE_FETCH_CONCURRENCY, imageBlocks.length),
    }).map(() => fetchNextImage()),
  );

  return results.filter((r): r is PdfImageAsset => r !== null);
}
