import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import {
  listFrontendModules,
  type FrontendModuleSummary,
} from "@/app/lib/frontend-modules/repository";

type CompanyFrontendModuleRow = {
  company_id: string;
  module_key: string;
  is_enabled: boolean;
};

export type CompanyFrontendModuleAssignment = {
  moduleKey: string;
  /** Globally available in site_frontend_modules. */
  globalEnabled: boolean;
  /** Enabled for this company (default false). */
  companyEnabled: boolean;
  sortOrder: number;
};

function normalizeModuleKey(value: string): string {
  return value.trim().toLowerCase();
}

async function listCompanyModuleRows(
  companyId: string,
): Promise<CompanyFrontendModuleRow[]> {
  if (!isSupabaseAdminConfigured() || !companyId.trim()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_frontend_modules")
    .select("company_id, module_key, is_enabled")
    .eq("company_id", companyId.trim());

  if (error || !data) {
    return [];
  }

  return data as CompanyFrontendModuleRow[];
}

/**
 * Effective module keys for a company = global on AND company on.
 * Missing company row means off (not auto-enabled).
 */
export const getEnabledFrontendModuleKeysForCompany = cache(
  async (companyId: string): Promise<Set<string>> => {
    if (!companyId.trim()) {
      return new Set();
    }

    if (!isSupabaseAdminConfigured()) {
      return new Set();
    }

    const [modules, companyRows] = await Promise.all([
      listFrontendModules(),
      listCompanyModuleRows(companyId),
    ]);

    const companyEnabled = new Set(
      companyRows
        .filter((row) => row.is_enabled)
        .map((row) => row.module_key),
    );

    return new Set(
      modules
        .filter(
          (module) =>
            module.isEnabled && companyEnabled.has(module.moduleKey),
        )
        .map((module) => module.moduleKey),
    );
  },
);

export async function listCompanyFrontendModuleAssignments(
  companyId: string,
): Promise<CompanyFrontendModuleAssignment[]> {
  const trimmed = companyId.trim();
  if (!trimmed || !isSupabaseAdminConfigured()) {
    return [];
  }

  const [modules, companyRows] = await Promise.all([
    listFrontendModules(),
    listCompanyModuleRows(trimmed),
  ]);

  const companyMap = new Map(
    companyRows.map((row) => [row.module_key, row.is_enabled] as const),
  );

  return modules
    .map((module: FrontendModuleSummary) => ({
      moduleKey: module.moduleKey,
      globalEnabled: module.isEnabled,
      companyEnabled: companyMap.get(module.moduleKey) === true,
      sortOrder: module.sortOrder,
    }))
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return left.moduleKey.localeCompare(right.moduleKey);
    });
}

export async function setCompanyFrontendModuleEnabled(
  companyId: string,
  moduleKey: string,
  isEnabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedCompanyId = companyId.trim();
  const normalizedKey = normalizeModuleKey(moduleKey);

  if (!trimmedCompanyId) {
    return { ok: false, error: "Uzņēmums nav norādīts." };
  }
  if (!normalizedKey) {
    return { ok: false, error: "Ievadi moduļa atslēgu." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const modules = await listFrontendModules();
  const globalModule = modules.find(
    (module) => module.moduleKey === normalizedKey,
  );
  if (!globalModule) {
    return { ok: false, error: "Frontend modulis nav atrasts." };
  }
  if (isEnabled && !globalModule.isEnabled) {
    return {
      ok: false,
      error: "Modulis nav globāli ieslēgts un to nevar piešķirt uzņēmumam.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("company_frontend_modules").upsert(
    {
      company_id: trimmedCompanyId,
      module_key: normalizedKey,
      is_enabled: isEnabled,
    },
    { onConflict: "company_id,module_key" },
  );

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt uzņēmuma moduļa statusu." };
  }

  return { ok: true };
}
