import { cache } from "react";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validatePhone } from "@/app/lib/validation/contact-fields";
import { resolveWorkerPhotoDisplayUrl } from "@/app/lib/workers/photo-storage";
import type {
  CreateWorkerInput,
  UpdateWorkerInput,
  WorkerRow,
  WorkerSummary,
} from "@/app/lib/workers/types";

function mapWorker(row: WorkerRow): WorkerSummary {
  const hasPhoto = Boolean(row.photo_path?.trim());
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone ?? "",
    phoneCallingCode: row.phone_calling_code?.trim() || DEFAULT_CALLING_CODE,
    photoUrl: resolveWorkerPhotoDisplayUrl(row.id, hasPhoto),
    sortOrder: row.sort_order,
  };
}

function validateWorkerFields(input: CreateWorkerInput): string | null {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!firstName) {
    return "Ievadi vārdu.";
  }
  if (!lastName) {
    return "Ievadi uzvārdu.";
  }

  if (input.phone.trim()) {
    const phoneError = validatePhone(input.phone, input.phoneCallingCode);
    if (phoneError) {
      return phoneError;
    }
  }

  return null;
}

export const listWorkers = cache(async function listWorkers(): Promise<WorkerSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_workers")
    .select(
      "id, first_name, last_name, phone, phone_calling_code, photo_path, sort_order",
    )
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapWorker(row as WorkerRow));
});

export async function createWorker(
  input: CreateWorkerInput,
): Promise<{ ok: true; worker: WorkerSummary } | { ok: false; error: string }> {
  const validationError = validateWorkerFields(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

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
  const { data: maxRow } = await supabase
    .from("company_workers")
    .select("sort_order")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder =
    maxRow && typeof (maxRow as WorkerRow).sort_order === "number"
      ? (maxRow as WorkerRow).sort_order + 1
      : 0;

  const { data, error } = await supabase
    .from("company_workers")
    .insert({
      company_id: companyId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: input.phone.trim(),
      phone_calling_code: input.phoneCallingCode.trim() || DEFAULT_CALLING_CODE,
      sort_order: nextSortOrder,
    })
    .select(
      "id, first_name, last_name, phone, phone_calling_code, photo_path, sort_order",
    )
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās pievienot darbinieku." };
  }

  return { ok: true, worker: mapWorker(data as WorkerRow) };
}

export async function updateWorker(
  input: UpdateWorkerInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validationError = validateWorkerFields(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

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
  const { error } = await supabase
    .from("company_workers")
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: input.phone.trim(),
      phone_calling_code: input.phoneCallingCode.trim() || DEFAULT_CALLING_CODE,
    })
    .eq("id", input.id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt darbinieku." };
  }

  return { ok: true };
}

export async function deleteWorker(
  id: string,
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
  const { error } = await supabase
    .from("company_workers")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst darbinieku." };
  }

  return { ok: true };
}

export async function getWorkerById(
  id: string,
): Promise<WorkerSummary | null> {
  const workers = await listWorkers();
  return workers.find((worker) => worker.id === id) ?? null;
}
