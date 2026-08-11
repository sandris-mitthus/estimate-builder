import { downloadSiteBrandingFile } from "@/app/lib/site-admin/branding-storage";
import type { SiteBrandingAssetKind } from "@/app/lib/site-admin/branding-validation";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

const RASTER_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function extensionForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "bin";
}

export async function serveSiteBrandingAsset(kind: SiteBrandingAssetKind) {
  if (!isSupabaseAdminConfigured()) {
    return new Response("Not configured", { status: 503 });
  }

  const supabase = createAdminClient();
  const asset = await downloadSiteBrandingFile(supabase, kind);

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  const mimeType = (asset.mimeType || "").split(";")[0]?.trim().toLowerCase() || "";
  if (!RASTER_MIME.has(mimeType) || mimeType.includes("svg")) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await asset.data.arrayBuffer();
  const filename = `${kind}.${extensionForMime(mimeType)}`;

  return new Response(buffer, {
    headers: {
      "Content-Type": mimeType,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // Publiski: login un pārlūka cilne. Cache-bust caur ?v= timestamp URL.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
