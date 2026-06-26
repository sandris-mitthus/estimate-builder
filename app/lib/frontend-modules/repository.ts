import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";

type FrontendModuleRow = {
  id: string;
  module_key: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FrontendModuleSummary = {
  id: string;
  moduleKey: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type FrontendModuleInput = {
  moduleKey: string;
};

const MODULE_KEY_PATTERN = /^[a-z0-9._:-]+$/;

function mapFrontendModuleRow(row: FrontendModuleRow): FrontendModuleSummary {
  return {
    id: row.id,
    moduleKey: row.module_key,
    isEnabled: row.is_enabled,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeModuleKey(value: string): string {
  return value.trim().toLowerCase();
}

function validateModuleKey(moduleKey: string): string | null {
  if (!moduleKey) {
    return "Ievadi moduļa atslēgu.";
  }

  if (moduleKey.length > 128 || !MODULE_KEY_PATTERN.test(moduleKey)) {
    return "Atslēgai jābūt formātā ar mazajiem burtiem, cipariem, punktiem, svītrām, apakšsvītrām un kolu.";
  }

  return null;
}

export async function listFrontendModules(): Promise<FrontendModuleSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .select("id, module_key, is_enabled, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("module_key", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as FrontendModuleRow[]).map(mapFrontendModuleRow);
}

export const getEnabledFrontendModuleKeys = cache(
  async (): Promise<Set<string>> => {
    if (!isSupabaseAdminConfigured()) {
      return new Set(Object.values(FRONTEND_MODULE_KEYS));
    }

    const modules = await listFrontendModules();
    return new Set(
      modules
        .filter((module) => module.isEnabled)
        .map((module) => module.moduleKey),
    );
  },
);

export async function createFrontendModule(
  input: FrontendModuleInput,
): Promise<{ ok: true; module: FrontendModuleSummary } | { ok: false; error: string }> {
  const moduleKey = normalizeModuleKey(input.moduleKey);
  const keyError = validateModuleKey(moduleKey);

  if (keyError) {
    return { ok: false, error: keyError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("site_frontend_modules")
    .select("id")
    .eq("module_key", moduleKey)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "Modulis ar šo atslēgu jau eksistē." };
  }

  const existingModules = await listFrontendModules();
  const nextSortOrder =
    Math.max(0, ...existingModules.map((module) => module.sortOrder)) + 10;

  const { data, error } = await supabase
    .from("site_frontend_modules")
    .insert({
      module_key: moduleKey,
      is_enabled: false,
      sort_order: nextSortOrder,
    })
    .select("id, module_key, is_enabled, sort_order, created_at, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās izveidot frontend moduli." };
  }

  return { ok: true, module: mapFrontendModuleRow(data as FrontendModuleRow) };
}

export async function updateFrontendModuleEnabled(
  moduleKey: string,
  isEnabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedKey = normalizeModuleKey(moduleKey);
  const keyError = validateModuleKey(normalizedKey);

  if (keyError) {
    return { ok: false, error: keyError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .update({ is_enabled: isEnabled })
    .eq("module_key", normalizedKey)
    .select("id");

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt moduļa statusu." };
  }

  if (!data || data.length === 0) {
    return { ok: false, error: "Frontend modulis nav atrasts." };
  }

  return { ok: true };
}

export async function deleteFrontendModule(
  moduleKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedKey = normalizeModuleKey(moduleKey);
  const keyError = validateModuleKey(normalizedKey);

  if (keyError) {
    return { ok: false, error: keyError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .delete()
    .eq("module_key", normalizedKey)
    .select("id");

  if (error) {
    return { ok: false, error: "Neizdevās dzēst frontend moduli." };
  }

  if (!data || data.length === 0) {
    return { ok: false, error: "Frontend modulis nav atrasts." };
  }

  return { ok: true };
}

export async function isFrontendModuleEnabled(moduleKey: string): Promise<boolean> {
  const normalizedKey = normalizeModuleKey(moduleKey);

  if (!normalizedKey) {
    return false;
  }

  const enabledKeys = await getEnabledFrontendModuleKeys();
  return enabledKeys.has(normalizedKey);
}
