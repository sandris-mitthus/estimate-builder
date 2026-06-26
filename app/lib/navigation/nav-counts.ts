import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { normalizeProjectStatus, isProjectVisibleInList } from "@/app/lib/projects/project-status";
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
  const { data, error } = await supabase
    .from("projects")
    .select("status")
    .eq("company_id", companyId);

  if (error || !data) {
    return 0;
  }

  return data.filter((row) =>
    isProjectVisibleInList(normalizeProjectStatus(row.status)),
  ).length;
}

async function countActiveLanguageTranslations(languageCode: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return 0;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_translations")
    .select("values");

  if (error || !data) {
    return 0;
  }

  return data.filter((row) => {
    const values = row.values;
    if (typeof values !== "object" || values === null || Array.isArray(values)) {
      return false;
    }

    const value = (values as Record<string, unknown>)[languageCode];
    return typeof value === "string" && value.trim().length > 0;
  }).length;
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
