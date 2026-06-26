import { COMPANY_LOGO_BUCKET } from "@/app/lib/settings/logo-storage";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import {
  getWorkerPhotoExtension,
  validateWorkerPhotoFile,
  WORKER_PHOTO_EXTENSIONS,
} from "@/app/lib/workers/photo-validation";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateFileMagicBytes } from "@/app/lib/security/magic-bytes";

export function resolveWorkerPhotoDisplayUrl(workerId: string, hasPhoto: boolean): string {
  if (!hasPhoto) return "";
  return `/api/workers/photo?workerId=${encodeURIComponent(workerId)}`;
}

export async function downloadWorkerPhotoFile(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  workerId: string,
): Promise<{ data: Blob; mimeType: string } | null> {
  const prefix = `companies/${companyId}/workers/${workerId}`;

  for (const extension of WORKER_PHOTO_EXTENSIONS) {
    const path = `${prefix}/photo.${extension}`;
    const { data, error } = await supabase.storage
      .from(COMPANY_LOGO_BUCKET)
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

async function removeExistingWorkerPhotos(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  workerId: string,
) {
  const prefix = `companies/${companyId}/workers/${workerId}`;
  const { data } = await supabase.storage.from(COMPANY_LOGO_BUCKET).list(prefix);

  if (!data?.length) {
    return;
  }

  await supabase.storage
    .from(COMPANY_LOGO_BUCKET)
    .remove(data.map((file) => `${prefix}/${file.name}`));
}

export async function uploadWorkerPhoto(
  workerId: string,
  file: File,
): Promise<{ ok: true; photoUrl: string } | { ok: false; error: string; errorKey?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
      errorKey: "errors.database_service_role_not_configured",
    };
  }

  const validation = validateWorkerPhotoFile(file);
  if (!validation.ok) {
    return validation;
  }

  const magicCheck = await validateFileMagicBytes(file, file.type);
  if (!magicCheck.ok) {
    return magicCheck;
  }

  const extension = getWorkerPhotoExtension(file.type);
  if (!extension) {
    return { ok: false, error: "Neatbalstīts attēla formāts." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  await removeExistingWorkerPhotos(supabase, companyId, workerId);

  const path = `companies/${companyId}/workers/${workerId}/photo.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(COMPANY_LOGO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { ok: false, error: "Neizdevās augšupielādēt foto." };
  }

  await supabase
    .from("company_workers")
    .update({ photo_path: path })
    .eq("id", workerId)
    .eq("company_id", companyId);

  return {
    ok: true,
    photoUrl: `${resolveWorkerPhotoDisplayUrl(workerId, true)}&v=${Date.now()}`,
  };
}

export async function deleteWorkerPhotoFromStorage(
  workerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  await removeExistingWorkerPhotos(supabase, companyId, workerId);

  await supabase
    .from("company_workers")
    .update({ photo_path: null })
    .eq("id", workerId)
    .eq("company_id", companyId);

  return { ok: true };
}
