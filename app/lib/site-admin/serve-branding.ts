import { downloadSiteBrandingFile } from "@/app/lib/site-admin/branding-storage";
import type { SiteBrandingAssetKind } from "@/app/lib/site-admin/branding-validation";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export async function serveSiteBrandingAsset(kind: SiteBrandingAssetKind) {
  if (!isSupabaseAdminConfigured()) {
    return new Response("Not configured", { status: 503 });
  }

  const supabase = createAdminClient();
  const asset = await downloadSiteBrandingFile(supabase, kind);

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await asset.data.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": asset.mimeType,
      // Publiski: login un pārlūka cilne. Cache-bust caur ?v= timestamp URL.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
