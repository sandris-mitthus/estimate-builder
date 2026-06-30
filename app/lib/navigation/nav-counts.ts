import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type NavCountMap = Record<string, number>;

type CountQuery = {
  count: number | null;
  error: unknown;
};

async function countRows(tableName: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return 0;
  }

  const supabase = createAdminClient();
  const result = (await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true })) as CountQuery;
  return result.error ? 0 : (result.count ?? 0);
}

async function countCompanyRows(tableName: string, companyId: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return 0;
  }

  const supabase = createAdminClient();
  const result = (await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)) as CountQuery;
  return result.error ? 0 : (result.count ?? 0);
}

async function countCompanyUserRows(
  tableName: string,
  companyId: string,
  userId: string,
): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return 0;
  }

  const supabase = createAdminClient();
  const result = (await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("user_id", userId)) as CountQuery;
  return result.error ? 0 : (result.count ?? 0);
}

async function countVisibleProjects(companyId: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return 0;
  }

  const supabase = createAdminClient();
  const result = (await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["active", "approved"])) as CountQuery;
  return result.error ? 0 : (result.count ?? 0);
}

async function countActiveLanguageTranslations(languageCode: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return 0;
  }

  const supabase = createAdminClient();
  const safeLanguageCode = /^[a-z]{2,10}(-[a-z0-9]{2,10})?$/i.test(languageCode)
    ? languageCode
    : "lv";
  const valuePath = `values->>${safeLanguageCode}`;
  const result = (await supabase
    .from("site_translations")
    .select("*", { count: "exact", head: true })
    .not(valuePath, "is", null)
    .neq(valuePath, "")) as CountQuery;
  return result.error ? 0 : (result.count ?? 0);
}

export async function getNavigationCounts({
  isSystemAdmin,
  activeLanguageCode,
}: {
  isSystemAdmin: boolean;
  activeLanguageCode: string;
}): Promise<NavCountMap> {
  if (!isSupabaseAdminConfigured()) {
    return {};
  }

  if (isSystemAdmin) {
    const [
      docs,
      companies,
      companyUsers,
      groups,
      frontendModules,
      languages,
      translations,
    ] = await Promise.all([
      countRows("site_docs"),
      countRows("companies"),
      countRows("company_users"),
      countRows("site_user_groups"),
      countRows("site_frontend_modules"),
      countRows("site_languages"),
      countActiveLanguageTranslations(activeLanguageCode),
    ]);

    return {
      "system_admin:site_docs": docs,
      "system_admin:site_companies": companies,
      "system_admin:site_companies_users": companyUsers,
      "system_admin:site_user_groups": groups,
      "system_admin:site_frontend_modules": frontendModules,
      "system_admin:site_languages": languages,
      "system_admin:site_translations": translations,
    };
  }

  const [companyId, user] = await Promise.all([getCurrentCompanyId(), getCurrentUser()]);
  if (!companyId || !user) {
    return {};
  }

  const [projects, modules, positions, excludedPositions, todo, users] =
    await Promise.all([
      countVisibleProjects(companyId),
      countCompanyRows("building_modules", companyId),
      countCompanyRows("position_prices", companyId),
      countCompanyRows("excluded_positions", companyId),
      countCompanyUserRows("todo_tasks", companyId, user.id),
      countCompanyRows("company_users", companyId),
    ]);

  return {
    projects,
    modules,
    positions,
    excluded_positions: excludedPositions,
    todo,
    users,
  };
}
