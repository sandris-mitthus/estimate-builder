import {
  SITE_BRANDING_EXTENSIONS,
  getSiteBrandingExtension,
  siteBrandingApiPath,
  validateSiteBrandingFile,
  type SiteBrandingAssetKind,
} from "@/app/lib/site-admin/branding-validation";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateFileMagicBytes } from "@/app/lib/security/magic-bytes";

export const SITE_ASSETS_BUCKET = "site-assets";

function storagePrefix(kind: SiteBrandingAssetKind): string {
  return kind === "logo" ? "logo" : "favicon";
}

export async function downloadSiteBrandingFile(
  supabase: ReturnType<typeof createAdminClient>,
  kind: SiteBrandingAssetKind,
): Promise<{ data: Blob; mimeType: string } | null> {
  const prefix = storagePrefix(kind);

  for (const extension of SITE_BRANDING_EXTENSIONS) {
    const path = `${prefix}.${extension}`;
    const { data, error } = await supabase.storage
      .from(SITE_ASSETS_BUCKET)
      .download(path);

    if (!error && data) {
      const mimeType =
        data.type ||
        (extension === "jpg" ? "image/jpeg" : `image/${extension}`);

      return { data, mimeType };
    }
  }

  return null;
}

async function removeExistingSiteBrandingFiles(
  supabase: ReturnType<typeof createAdminClient>,
  kind: SiteBrandingAssetKind,
) {
  const prefix = storagePrefix(kind);
  const paths = SITE_BRANDING_EXTENSIONS.map(
    (extension) => `${prefix}.${extension}`,
  );

  await supabase.storage.from(SITE_ASSETS_BUCKET).remove(paths);
}

export async function uploadSiteBrandingAsset(
  kind: SiteBrandingAssetKind,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const validation = validateSiteBrandingFile(file);
  if (!validation.ok) {
    return validation;
  }

  const magicCheck = await validateFileMagicBytes(file, file.type);
  if (!magicCheck.ok) {
    return magicCheck;
  }

  const extension = getSiteBrandingExtension(file.type);
  if (!extension) {
    return { ok: false, error: "Neatbalstīts attēla formāts." };
  }

  const supabase = createAdminClient();
  await removeExistingSiteBrandingFiles(supabase, kind);

  const path = `${storagePrefix(kind)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return {
      ok: false,
      error:
        kind === "logo"
          ? "Neizdevās augšupielādēt logotipu."
          : "Neizdevās augšupielādēt favicon.",
    };
  }

  return {
    ok: true,
    url: `${siteBrandingApiPath(kind)}?v=${Date.now()}`,
  };
}

export async function deleteSiteBrandingAsset(kind: SiteBrandingAssetKind) {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = createAdminClient();
  await removeExistingSiteBrandingFiles(supabase, kind);
}
