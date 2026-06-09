import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const COMPANY_LOGO_BUCKET = "company-assets";
export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

function getLogoExtension(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return null;
  }
}

export function validateCompanyLogoFile(file: File) {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return {
      ok: false as const,
      error: "Atbalstīti formāti: PNG, JPG, WEBP, SVG.",
    };
  }

  if (file.size > COMPANY_LOGO_MAX_BYTES) {
    return {
      ok: false as const,
      error: "Logotips nedrīkst būt lielāks par 2 MB.",
    };
  }

  return { ok: true as const };
}

async function removeExistingCompanyLogos(
  supabase: ReturnType<typeof createAdminClient>,
) {
  const { data } = await supabase.storage.from(COMPANY_LOGO_BUCKET).list("company");

  if (!data?.length) {
    return;
  }

  await supabase.storage
    .from(COMPANY_LOGO_BUCKET)
    .remove(data.map((file) => `company/${file.name}`));
}

export async function uploadCompanyLogo(
  file: File,
): Promise<{ ok: true; logoUrl: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const validation = validateCompanyLogoFile(file);
  if (!validation.ok) {
    return validation;
  }

  const extension = getLogoExtension(file.type);
  if (!extension) {
    return { ok: false, error: "Neatbalstīts attēla formāts." };
  }

  const supabase = createAdminClient();
  await removeExistingCompanyLogos(supabase);

  const path = `company/logo.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(COMPANY_LOGO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(COMPANY_LOGO_BUCKET).getPublicUrl(path);

  return {
    ok: true,
    logoUrl: `${publicUrl}?v=${Date.now()}`,
  };
}

export async function deleteCompanyLogoFromStorage() {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = createAdminClient();
  await removeExistingCompanyLogos(supabase);
}
