import {
  BOOTSTRAP_COMPANY_ID,
  getCurrentCompanyId,
} from "@/app/lib/companies/current-company";
import {
  COMPANY_LOGO_EXTENSIONS,
  getLogoExtension,
  validateCompanyLogoFile,
} from "@/app/lib/settings/logo-validation";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateFileMagicBytes } from "@/app/lib/security/magic-bytes";

export const COMPANY_LOGO_BUCKET = "company-assets";

export function resolveCompanyLogoDisplayUrl(storedUrl: string): string {
  const trimmed = storedUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/api/company/logo")) return trimmed;
  return "/api/company/logo";
}

export async function downloadCompanyLogoFile(
  supabase: ReturnType<typeof createAdminClient>,
  companyIdOverride?: string,
): Promise<{ data: Blob; mimeType: string } | null> {
  const companyId = companyIdOverride ?? (await getCurrentCompanyId());
  const pathPrefixes = companyId
    ? [`companies/${companyId}`, ...(companyId === BOOTSTRAP_COMPANY_ID ? ["company"] : [])]
    : ["company"];

  for (const prefix of pathPrefixes) {
    for (const extension of COMPANY_LOGO_EXTENSIONS) {
      const path = `${prefix}/logo.${extension}`;
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
  }

  return null;
}

async function removeExistingCompanyLogos(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
) {
  const prefix = `companies/${companyId}`;
  const { data } = await supabase.storage.from(COMPANY_LOGO_BUCKET).list(prefix);

  if (!data?.length) {
    return;
  }

  await supabase.storage
    .from(COMPANY_LOGO_BUCKET)
    .remove(data.map((file) => `${prefix}/${file.name}`));
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

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  await removeExistingCompanyLogos(supabase, companyId);

  const path = `companies/${companyId}/logo.${extension}`;
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
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return;
  }

  await removeExistingCompanyLogos(supabase, companyId);
}
