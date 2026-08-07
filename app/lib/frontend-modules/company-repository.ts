import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { getCompanyPaymentAccessRow } from "@/app/lib/companies/payment-access";
import { listFrontendModules } from "@/app/lib/frontend-modules/repository";
import type { FrontendModuleSummary } from "@/app/lib/frontend-modules/types";
import type { CompanyFrontendModuleAssignment } from "@/app/lib/frontend-modules/types";
import {
  isCompanyPaymentPlanActive,
} from "@/app/lib/payment-plans/helpers";
import {
  getPaymentPlanModuleKeys,
  getPaymentPlansEnabledCached,
} from "@/app/lib/payment-plans/repository";

export type { CompanyFrontendModuleAssignment } from "@/app/lib/frontend-modules/types";

type CompanyFrontendModuleRow = {
  company_id: string;
  module_key: string;
  is_enabled: boolean;
};

function normalizeModuleKey(value: string): string {
  return value.trim().toLowerCase();
}

function buildAssignmentsForCompany(
  modules: FrontendModuleSummary[],
  companyRows: CompanyFrontendModuleRow[],
): CompanyFrontendModuleAssignment[] {
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

async function getCompanyModuleIntersectionKeys(
  companyId: string,
  modules: FrontendModuleSummary[],
): Promise<Set<string>> {
  const companyRows = await listCompanyModuleRows(companyId);
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
}

/**
 * Effective module keys for a company.
 * - VIP: global on ∧ company_frontend_modules on (payment plan ignored).
 * - Payment plans ON: global on ∧ modules from active paid plan.
 * - Payment plans OFF: global on ∧ company_frontend_modules on.
 */
export const getEnabledFrontendModuleKeysForCompany = cache(
  async (companyId: string): Promise<Set<string>> => {
    if (!companyId.trim()) {
      return new Set();
    }

    if (!isSupabaseAdminConfigured()) {
      return new Set();
    }

    const modules = await listFrontendModules();
    const globallyEnabled = new Set(
      modules.filter((module) => module.isEnabled).map((module) => module.moduleKey),
    );

    const payment = await getCompanyPaymentAccessRow(companyId);
    if (payment?.is_vip === true) {
      return getCompanyModuleIntersectionKeys(companyId, modules);
    }

    const paymentPlansEnabled = await getPaymentPlansEnabledCached();
    if (paymentPlansEnabled) {
      const until = payment?.payment_plan_until
        ? String(payment.payment_plan_until).slice(0, 10)
        : null;
      if (
        !payment ||
        !isCompanyPaymentPlanActive({
          paymentPlanId: payment.payment_plan_id,
          paymentPlanUntil: until,
          paymentPlanPaid: payment.payment_plan_paid === true,
        })
      ) {
        return new Set();
      }

      const planModules = await getPaymentPlanModuleKeys(
        payment.payment_plan_id ?? "",
      );
      return new Set(
        [...planModules].filter((key) => globallyEnabled.has(key)),
      );
    }

    return getCompanyModuleIntersectionKeys(companyId, modules);
  },
);

export async function listCompanyFrontendModuleAssignments(
  companyId: string,
): Promise<CompanyFrontendModuleAssignment[]> {
  const map = await listCompanyFrontendModuleAssignmentsForCompanies([
    companyId,
  ]);
  return map[companyId.trim()] ?? [];
}

/** One modules catalog + one IN query for all companies (avoids N+1). */
export async function listCompanyFrontendModuleAssignmentsForCompanies(
  companyIds: string[],
): Promise<Record<string, CompanyFrontendModuleAssignment[]>> {
  const ids = [...new Set(companyIds.map((id) => id.trim()).filter(Boolean))];
  if (!ids.length || !isSupabaseAdminConfigured()) {
    return {};
  }

  const modules = await listFrontendModules();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_frontend_modules")
    .select("company_id, module_key, is_enabled")
    .in("company_id", ids);

  const rowsByCompany = new Map<string, CompanyFrontendModuleRow[]>();
  for (const id of ids) {
    rowsByCompany.set(id, []);
  }
  if (!error && data) {
    for (const row of data as CompanyFrontendModuleRow[]) {
      const list = rowsByCompany.get(row.company_id);
      if (list) {
        list.push(row);
      } else {
        rowsByCompany.set(row.company_id, [row]);
      }
    }
  }

  return Object.fromEntries(
    ids.map((id) => [
      id,
      buildAssignmentsForCompany(modules, rowsByCompany.get(id) ?? []),
    ]),
  );
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
