import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateFileMagicBytes } from "@/app/lib/security/magic-bytes";

export const COMPANY_LOGO_BUCKET = "company-assets";
export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const COMPANY_LOGO_EXTENSIONS = ["png", "jpg", "webp", "svg"] as const;

export function resolveCompanyLogoDisplayUrl(storedUrl: string): string {
  const trimmed = storedUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/api/company/logo")) return trimmed;
  return "/api/company/logo";
}

export async function downloadCompanyLogoFile(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{ data: Blob; mimeType: string } | null> {
  for (const extension of COMPANY_LOGO_EXTENSIONS) {
    const path = `company/logo.${extension}`;
    const { data, error } = await supabase.storage
      .from(COMPANY_LOGO_BUCKET)
      .download(path);

    if (!error && data) {
      const mimeType =
        data.type ||
        (extension === "jpg"
          ? "image/jpeg"
          : extension === "svg"
            ? "image/svg+xml"
            : `image/${extension}`);

      return { data, mimeType };
    }
  }

  return null;
}

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

  const magicCheck = await validateFileMagicBytes(file, file.type);
  if (!magicCheck.ok) {
    return magicCheck;
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
    return { ok: false, error: "Neizdevās augšupielādēt logotipu." };
  }

  return {
    ok: true,
    logoUrl: `/api/company/logo?v=${Date.now()}`,
  };
}

export async function deleteCompanyLogoFromStorage() {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = createAdminClient();
  await removeExistingCompanyLogos(supabase);
}
