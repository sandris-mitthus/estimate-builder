import { downloadCompanyLogoFile } from "@/app/lib/settings/logo-storage";
import { MODULE_ASSETS_BUCKET } from "@/app/lib/modules/file-storage";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import type { ModuleContentBlock } from "@/app/lib/modules/types";

export type PdfImageAsset = { dataUrl: string };

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
  const imageBlocks = blocks.filter((b) => b.mimeType.startsWith("image/"));

  const results = await Promise.all(
    imageBlocks.map(async (block) => {
      const { data, error } = await supabase.storage
        .from(MODULE_ASSETS_BUCKET)
        .download(block.storagePath);
      if (error || !data) return null;
      const buffer = Buffer.from(await data.arrayBuffer());
      return { dataUrl: toDataUrl(buffer, block.mimeType) };
    }),
  );

  return results.filter((r): r is PdfImageAsset => r !== null);
}
