import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/app/lib/supabase/admin";
import type { TranslationDictionary } from "@/app/lib/i18n/translations";
import {
  SITE_DOCS_CACHE_TAG,
  SITE_LANGUAGES_CACHE_TAG,
  SITE_SETTINGS_CACHE_TAG,
  SITE_TRANSLATIONS_CACHE_TAG,
} from "@/app/lib/i18n/cache-tags";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import {
  resolveSiteBrandingDisplayUrl,
  sanitizeSiteBrandingUrl,
  type SiteBrandingAssetKind,
} from "@/app/lib/site-admin/branding-validation";
import { isValidEmail } from "@/app/lib/validation/contact-fields";
import {
  DEFAULT_GROUP_DEFINITIONS,
  normalizePermissionSet,
  type PermissionSet,
  type UserGroupSummary,
} from "@/app/lib/auth/permissions";

type CompanyRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type CompanyUserRow = {
  company_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type CompanyGroupMemberRow = {
  company_id: string;
  user_id: string;
  group_id: string;
};

type CompanyUserGroupRow = {
  id: string;
  company_id: string;
  name: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

type AuthUserActivity = {
  createdAt: string;
  lastSeenAt: string | null;
};

type CompanySettingsRow = {
  company_id: string;
  company_name: string;
  address: string;
  registration_number: string;
  phone: string;
  email: string;
  logo_url: string;
  currency: string;
  estimate_validity_days: number | null;
  offer_validity_days: number | null;
  default_hourly_rate: number | null;
  updated_at: string;
};

type GlobalSiteSettingsRow = {
  id: number;
  system_name: string;
  slogan: string;
  controller_name: string;
  controller_registration_number: string;
  controller_address: string;
  controller_email: string;
  logo_url: string;
  favicon_url: string;
  updated_at: string;
};

type SiteUserGroupRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  permissions: unknown;
  is_default: boolean;
  sort_order: number;
};

type SiteLanguageRow = {
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
};

type SiteTranslationRow = {
  translation_key: string;
  namespace: string;
  description: string;
  values: unknown;
  updated_at: string;
};

type SiteDocCategoryRow = {
  id: string;
  title: string;
  sort_order: number;
  updated_at: string;
};

type SiteDocRow = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  sort_order: number;
  updated_at: string;
};

export type SiteCompanySummary = {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  settingsCompanyName: string;
  registrationNumber: string;
  address: string;
  email: string;
  phone: string;
  userCount: number;
  activeUserCount: number;
};

export type SiteCompanyUserSummary = {
  companyId: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  role: string;
  roleName: string | null;
  status: string;
  isSystemAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  registeredAt: string;
  editedAt: string;
  lastSeenAt: string | null;
};

export type SiteSettingsSummary = {
  systemName: string;
  slogan: string;
  controllerName: string;
  controllerRegistrationNumber: string;
  controllerAddress: string;
  controllerEmail: string;
  logoUrl: string;
  faviconUrl: string;
  updatedAt: string;
};

export type SiteSettingsInput = {
  systemName: string;
  slogan: string;
  controllerName: string;
  controllerRegistrationNumber: string;
  controllerAddress: string;
  controllerEmail: string;
};

export type SiteUserGroupSummary = UserGroupSummary & {
  description: string;
  isDefault: boolean;
  sortOrder: number;
};

export type SiteUserGroupInput = {
  name: string;
};

export type SiteLanguageSummary = {
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
};

export type SiteLanguageInput = {
  code: string;
  name: string;
  isDefault?: boolean;
};

export type SiteLanguageUpdateInput = {
  code: string;
  name: string;
};

export type SiteTranslationSummary = {
  key: string;
  namespace: string;
  description: string;
  values: Record<string, string>;
  updatedAt: string;
};

export type SiteTranslationInput = {
  key: string;
  namespace: string;
  description: string;
  values: Record<string, string>;
};

export type SiteDocSummary = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  sortOrder: number;
  updatedAt: string;
};

export type SiteDocCategorySummary = {
  id: string;
  title: string;
  sortOrder: number;
  updatedAt: string;
  docs: SiteDocSummary[];
};

export type SiteDocCategoryInput = {
  title: string;
};

export type SiteDocInput = {
  categoryId: string;
  title: string;
  description: string;
};

export type SiteDocReorderItem = {
  id: string;
  categoryId: string;
  sortOrder: number;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsSummary = {
  systemName: "Estimate Builder",
  slogan: "Tāmes piedāvājumu veidošana",
  controllerName: "",
  controllerRegistrationNumber: "",
  controllerAddress: "",
  controllerEmail: "",
  logoUrl: "",
  faviconUrl: "",
  updatedAt: "",
};

export const DEFAULT_SITE_LANGUAGES: SiteLanguageSummary[] = [
  {
    code: "lv",
    name: "Latviešu",
    isActive: true,
    isDefault: true,
    sortOrder: 10,
  },
  {
    code: "en",
    name: "English",
    isActive: true,
    isDefault: false,
    sortOrder: 20,
  },
];

const DEFAULT_SITE_DOC_CATEGORIES: SiteDocCategorySummary[] = [
  {
    id: "default-docs-overview",
    title: "Kopskats",
    sortOrder: 10,
    updatedAt: "",
    docs: [
      {
        id: "default-docs-daily-work",
        categoryId: "default-docs-overview",
        title: "Ko sistēmā dara ikdienā?",
        description:
          "Estimate Builder ir darba vide, kur no sagatavēm un kataloga datiem tiek izveidots konkrēta projekta aprēķins.",
        sortOrder: 10,
        updatedAt: "",
      },
    ],
  },
  {
    id: "default-docs-projects",
    title: "Projekti",
    sortOrder: 20,
    updatedAt: "",
    docs: [
      {
        id: "default-docs-project-lifecycle",
        categoryId: "default-docs-projects",
        title: "Projekta dzīves cikls",
        description:
          "Projektā glabā klienta kontaktus, projekta statusu, piesaistīto ēkas moduli un sagatavoto tāmi.",
        sortOrder: 10,
        updatedAt: "",
      },
    ],
  },
];

function mapSiteUserGroupRow(row: SiteUserGroupRow): SiteUserGroupSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isSystem: true,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    permissions: normalizePermissionSet(row.permissions),
  };
}

function slugifySiteGroupName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "grupa";
}

async function buildUniqueSiteGroupSlug(
  supabase: ReturnType<typeof createAdminClient>,
  name: string,
): Promise<string> {
  const baseSlug = slugifySiteGroupName(name);
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const { data } = await supabase
      .from("site_user_groups")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

function fallbackSiteUserGroups(): SiteUserGroupSummary[] {
  return DEFAULT_GROUP_DEFINITIONS.map((group, index) => ({
    id: `fallback-${group.slug}`,
    slug: group.slug,
    name: group.name,
    description:
      group.slug === "admin"
        ? "Pilna sistēmas un uzņēmuma pārvaldības pieeja."
        : "Lasīšanas pieeja bez pārvaldības darbībām.",
    isSystem: true,
    isDefault: true,
    sortOrder: (index + 1) * 10,
    permissions: group.permissions,
  }));
}

function mapSiteLanguageRow(row: SiteLanguageRow): SiteLanguageSummary {
  return {
    code: row.code,
    name: row.name,
    isActive: row.is_active,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
  };
}

function normalizeLanguageCode(code: string): string {
  const [language = "", region = ""] = code.trim().split("-");
  return region
    ? `${language.toLowerCase()}-${region.toUpperCase()}`
    : language.toLowerCase();
}

function validateLanguageCode(code: string): string | null {
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(code)) {
    return "Valodas kodam jābūt formātā lv, en vai en-US.";
  }

  return null;
}

function normalizeTranslationKey(key: string): string {
  return key.trim();
}

function validateTranslationKey(key: string): string | null {
  if (!key) {
    return "Ievadi tulkojuma key.";
  }

  if (!/^[a-zA-Z0-9_.:-]+$/.test(key)) {
    return "Key drīkst saturēt burtus, ciparus, punktus, svītras, apakšsvītras un kolus.";
  }

  return null;
}

function normalizeTranslationValues(
  values: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).map(([code, value]) => [code.trim(), value.trim()]),
  );
}

function mapTranslationRow(row: SiteTranslationRow): SiteTranslationSummary {
  const values =
    row.values && typeof row.values === "object" && !Array.isArray(row.values)
      ? (row.values as Record<string, unknown>)
      : {};

  return {
    key: row.translation_key,
    namespace: row.namespace,
    description: row.description,
    values: Object.fromEntries(
      Object.entries(values).map(([code, value]) => [
        code,
        typeof value === "string" ? value : "",
      ]),
    ),
    updatedAt: row.updated_at,
  };
}

export async function listSiteCompanies(): Promise<SiteCompanySummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const [companiesResult, usersResult, settingsResult] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, created_at, updated_at")
      .order("name", { ascending: true }),
    supabase.from("company_users").select("company_id, status"),
    supabase
      .from("company_settings")
      .select(
        "company_id, company_name, registration_number, address, email, phone, logo_url",
      ),
  ]);

  if (companiesResult.error || !companiesResult.data) {
    return [];
  }

  const userStatsByCompanyId = new Map<
    string,
    { userCount: number; activeUserCount: number }
  >();

  for (const membership of (usersResult.data ?? []) as Pick<
    CompanyUserRow,
    "company_id" | "status"
  >[]) {
    const stats = userStatsByCompanyId.get(membership.company_id) ?? {
      userCount: 0,
      activeUserCount: 0,
    };
    stats.userCount += 1;
    if (membership.status === "active") {
      stats.activeUserCount += 1;
    }
    userStatsByCompanyId.set(membership.company_id, stats);
  }

  const settingsByCompanyId = new Map(
    ((settingsResult.data ?? []) as Pick<
      CompanySettingsRow,
      | "company_id"
      | "company_name"
      | "registration_number"
      | "address"
      | "email"
      | "phone"
      | "logo_url"
    >[]).map((settings) => [settings.company_id, settings]),
  );

  return ((companiesResult.data ?? []) as CompanyRow[]).map((company) => {
    const stats = userStatsByCompanyId.get(company.id) ?? {
      userCount: 0,
      activeUserCount: 0,
    };
    const settings = settingsByCompanyId.get(company.id);

    return {
      id: company.id,
      name: company.name,
      logoUrl: settings?.logo_url?.trim()
        ? `/api/company/logo?companyId=${encodeURIComponent(company.id)}`
        : null,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
      settingsCompanyName: settings?.company_name ?? "",
      registrationNumber: settings?.registration_number ?? "",
      address: settings?.address ?? "",
      email: settings?.email ?? "",
      phone: settings?.phone ?? "",
      userCount: stats.userCount,
      activeUserCount: stats.activeUserCount,
    };
  });
}

export async function listSiteCompanyUsers(): Promise<SiteCompanyUserSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const [
    membershipsResult,
    companiesResult,
    companySettingsResult,
    usersResult,
    groupMembershipsResult,
    groupsResult,
    authUsersResult,
  ] =
    await Promise.all([
      supabase
        .from("company_users")
        .select("company_id, user_id, role, status, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name"),
      supabase.from("company_settings").select("company_id, logo_url"),
      supabase
        .from("users")
        .select("id, email, name, avatar_url, is_admin, created_at, updated_at"),
      supabase.from("company_group_members").select("company_id, user_id, group_id"),
      supabase.from("company_user_groups").select("id, company_id, name"),
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  if (membershipsResult.error || !membershipsResult.data) {
    return [];
  }

  const companyNameById = new Map(
    ((companiesResult.data ?? []) as Pick<CompanyRow, "id" | "name">[]).map(
      (company) => [company.id, company.name],
    ),
  );
  const companyLogoUrlById = new Map(
    ((companySettingsResult.data ?? []) as Pick<
      CompanySettingsRow,
      "company_id" | "logo_url"
    >[])
      .filter((settings) => settings.logo_url.trim().length > 0)
      .map((settings) => [
        settings.company_id,
        `/api/company/logo?companyId=${encodeURIComponent(settings.company_id)}`,
      ]),
  );
  const userById = new Map(
    ((usersResult.data ?? []) as UserRow[]).map((user) => [user.id, user]),
  );
  const groupNameByKey = new Map(
    ((groupsResult.data ?? []) as CompanyUserGroupRow[]).map((group) => [
      `${group.company_id}:${group.id}`,
      group.name,
    ]),
  );
  const groupNameByMembershipKey = new Map(
    ((groupMembershipsResult.data ?? []) as CompanyGroupMemberRow[]).map(
      (membership) => [
        `${membership.company_id}:${membership.user_id}`,
        groupNameByKey.get(`${membership.company_id}:${membership.group_id}`) ?? null,
      ],
    ),
  );
  const authActivityByUserId = new Map<string, AuthUserActivity>();

  if (!authUsersResult.error) {
    for (const authUser of authUsersResult.data.users) {
      authActivityByUserId.set(authUser.id, {
        createdAt: authUser.created_at,
        lastSeenAt: authUser.last_sign_in_at ?? null,
      });
    }
  }

  const membershipRows: SiteCompanyUserSummary[] = (
    (membershipsResult.data ?? []) as CompanyUserRow[]
  ).map((membership) => {
    const user = userById.get(membership.user_id);
    const authActivity = authActivityByUserId.get(membership.user_id);

    return {
      companyId: membership.company_id,
      companyName: companyNameById.get(membership.company_id) ?? "—",
      companyLogoUrl: companyLogoUrlById.get(membership.company_id) ?? null,
      userId: membership.user_id,
      userName: user?.name || user?.email || "—",
      userEmail: user?.email || "—",
      avatarUrl: user?.avatar_url?.trim() || null,
      role: membership.role,
      roleName:
        groupNameByMembershipKey.get(`${membership.company_id}:${membership.user_id}`) ??
        null,
      status: membership.status,
      isSystemAdmin: user?.is_admin === true,
      createdAt: membership.created_at,
      updatedAt: membership.updated_at,
      registeredAt: authActivity?.createdAt ?? user?.created_at ?? membership.created_at,
      editedAt: user?.updated_at ?? membership.updated_at,
      lastSeenAt: authActivity?.lastSeenAt ?? null,
    };
  });

  const systemAdminRows: SiteCompanyUserSummary[] = Array.from(userById.values())
    .filter((user) => user.is_admin === true)
    .map((user) => {
      const authActivity = authActivityByUserId.get(user.id);

      return {
        companyId: null,
        companyName: null,
        companyLogoUrl: null,
        userId: user.id,
        userName: user.name || user.email || "—",
        userEmail: user.email || "—",
        avatarUrl: user.avatar_url?.trim() || null,
        role: "system_admin",
        roleName: null,
        status: "active",
        isSystemAdmin: true,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        registeredAt: authActivity?.createdAt ?? user.created_at,
        editedAt: user.updated_at,
        lastSeenAt: authActivity?.lastSeenAt ?? null,
      };
    });

  return [...systemAdminRows, ...membershipRows];
}

export async function listSiteUserGroups(): Promise<SiteUserGroupSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return fallbackSiteUserGroups();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_user_groups")
    .select("id, slug, name, description, permissions, is_default, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return fallbackSiteUserGroups();
  }

  return (data as SiteUserGroupRow[]).map(mapSiteUserGroupRow);
}

export async function createSiteUserGroup(
  input: SiteUserGroupInput,
): Promise<
  | { ok: true; group: SiteUserGroupSummary }
  | { ok: false; error: string }
> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Grupas nosaukums nav norādīts." };
  }

  if (name.length > 80) {
    return { ok: false, error: "Grupas nosaukums ir pārāk garš." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const slug = await buildUniqueSiteGroupSlug(supabase, name);
  const viewer =
    (await listSiteUserGroups()).find((group) => group.slug === "viewer") ??
    fallbackSiteUserGroups().find((group) => group.slug === "viewer");
  const permissions = normalizePermissionSet(viewer?.permissions);
  const groups = await listSiteUserGroups();
  const nextSortOrder =
    Math.max(0, ...groups.map((group) => group.sortOrder)) + 10;

  const { data, error } = await supabase
    .from("site_user_groups")
    .insert({
      slug,
      name,
      description: "",
      permissions,
      is_default: false,
      sort_order: nextSortOrder,
    })
    .select("id, slug, name, description, permissions, is_default, sort_order")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās izveidot grupu." };
  }

  return { ok: true, group: mapSiteUserGroupRow(data as SiteUserGroupRow) };
}

export async function deleteSiteUserGroup(
  groupId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedGroupId = groupId.trim();
  if (!trimmedGroupId) {
    return { ok: false, error: "Grupa nav norādīta." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data: group } = await supabase
    .from("site_user_groups")
    .select("id, is_default")
    .eq("id", trimmedGroupId)
    .maybeSingle();

  if (!group) {
    return { ok: false, error: "Grupa nav atrasta." };
  }

  const { error } = await supabase
    .from("site_user_groups")
    .delete()
    .eq("id", trimmedGroupId);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst grupu." };
  }

  return { ok: true };
}

export async function updateSiteUserGroupPermissions(
  groupId: string,
  permissions: PermissionSet,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedGroupId = groupId.trim();
  if (!trimmedGroupId) {
    return { ok: false, error: "Grupa nav norādīta." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const normalized = normalizePermissionSet(permissions);
  const { error } = await supabase
    .from("site_user_groups")
    .update({ permissions: normalized })
    .eq("id", trimmedGroupId);

  if (error) {
    return {
      ok: false,
      error: "Neizdevās saglabāt sistēmas grupas tiesības.",
    };
  }

  return { ok: true };
}

async function listAllSiteLanguagesUncached(): Promise<SiteLanguageSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return DEFAULT_SITE_LANGUAGES;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_languages")
    .select("code, name, is_active, is_default, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return DEFAULT_SITE_LANGUAGES;
  }

  return (data as SiteLanguageRow[]).map(mapSiteLanguageRow);
}

const getCachedAllSiteLanguages = unstable_cache(
  listAllSiteLanguagesUncached,
  ["site-languages"],
  { tags: [SITE_LANGUAGES_CACHE_TAG] },
);

export async function listSiteLanguages(
  options: { activeOnly?: boolean } = {},
): Promise<SiteLanguageSummary[]> {
  const languages = isSupabaseAdminConfigured()
    ? await getCachedAllSiteLanguages()
    : DEFAULT_SITE_LANGUAGES;

  return options.activeOnly
    ? languages.filter((language) => language.isActive)
    : languages;
}

export async function createSiteLanguage(
  input: SiteLanguageInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = normalizeLanguageCode(input.code);
  const name = input.name.trim();

  const codeError = validateLanguageCode(code);
  if (codeError) {
    return { ok: false, error: codeError };
  }

  if (!name) {
    return { ok: false, error: "Ievadi valodas nosaukumu." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("site_languages")
    .select("code")
    .eq("code", code)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "Valoda ar šo kodu jau eksistē." };
  }

  const languages = await listSiteLanguages();
  const nextSortOrder =
    Math.max(0, ...languages.map((language) => language.sortOrder)) + 10;

  if (input.isDefault) {
    await supabase
      .from("site_languages")
      .update({ is_default: false })
      .eq("is_default", true);
  }

  const { error } = await supabase.from("site_languages").insert({
    code,
    name,
    is_active: true,
    is_default: input.isDefault === true,
    sort_order: nextSortOrder,
  });

  if (error) {
    return { ok: false, error: "Neizdevās izveidot valodu." };
  }

  return { ok: true };
}

export async function updateSiteLanguageActiveStatus(
  code: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedCode = normalizeLanguageCode(code);

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data: language } = await supabase
    .from("site_languages")
    .select("code, is_default")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!language) {
    return { ok: false, error: "Valoda nav atrasta." };
  }

  if (!isActive && language.is_default === true) {
    return { ok: false, error: "Noklusējuma valodu nevar deaktivizēt." };
  }

  const { error } = await supabase
    .from("site_languages")
    .update({ is_active: isActive })
    .eq("code", normalizedCode);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt valodas statusu." };
  }

  return { ok: true };
}

async function migrateTranslationLanguageCode(
  supabase: ReturnType<typeof createAdminClient>,
  fromCode: string,
  toCode: string | null,
): Promise<void> {
  const { data } = await supabase
    .from("site_translations")
    .select("translation_key, values");

  for (const row of (data ?? []) as Pick<
    SiteTranslationRow,
    "translation_key" | "values"
  >[]) {
    const values =
      row.values && typeof row.values === "object" && !Array.isArray(row.values)
        ? { ...(row.values as Record<string, unknown>) }
        : {};

    if (!(fromCode in values)) {
      continue;
    }

    if (toCode && !(toCode in values)) {
      values[toCode] = values[fromCode];
    }
    delete values[fromCode];

    await supabase
      .from("site_translations")
      .update({ values })
      .eq("translation_key", row.translation_key);
  }
}

export async function updateSiteLanguage(
  currentCode: string,
  input: SiteLanguageUpdateInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const oldCode = normalizeLanguageCode(currentCode);
  const nextCode = normalizeLanguageCode(input.code);
  const name = input.name.trim();

  const codeError = validateLanguageCode(nextCode);
  if (codeError) {
    return { ok: false, error: codeError };
  }

  if (!name) {
    return { ok: false, error: "Ievadi valodas nosaukumu." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data: existingLanguage } = await supabase
    .from("site_languages")
    .select("code, is_active, is_default, sort_order")
    .eq("code", oldCode)
    .maybeSingle();

  if (!existingLanguage) {
    return { ok: false, error: "Valoda nav atrasta." };
  }

  if (oldCode === nextCode) {
    const { error } = await supabase
      .from("site_languages")
      .update({ name })
      .eq("code", oldCode);

    return error
      ? { ok: false, error: "Neizdevās saglabāt valodu." }
      : { ok: true };
  }

  const { data: duplicateLanguage } = await supabase
    .from("site_languages")
    .select("code")
    .eq("code", nextCode)
    .maybeSingle();

  if (duplicateLanguage) {
    return { ok: false, error: "Valoda ar šo kodu jau eksistē." };
  }

  const { error: insertError } = await supabase.from("site_languages").insert({
    code: nextCode,
    name,
    is_active: existingLanguage.is_active === true,
    is_default: false,
    sort_order: existingLanguage.sort_order,
  });

  if (insertError) {
    return { ok: false, error: "Neizdevās saglabāt valodu." };
  }

  if (existingLanguage.is_default === true) {
    await supabase
      .from("site_languages")
      .update({ is_default: false })
      .eq("is_default", true);
    await supabase
      .from("site_languages")
      .update({ is_default: true, is_active: true })
      .eq("code", nextCode);
  }

  await supabase
    .from("users")
    .update({ active_language_code: nextCode })
    .eq("active_language_code", oldCode);
  await migrateTranslationLanguageCode(supabase, oldCode, nextCode);

  const { error: deleteError } = await supabase
    .from("site_languages")
    .delete()
    .eq("code", oldCode);

  if (deleteError) {
    return { ok: false, error: "Valoda saglabāta, bet veco kodu neizdevās noņemt." };
  }

  return { ok: true };
}

export async function deleteSiteLanguage(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedCode = normalizeLanguageCode(code);

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data: language } = await supabase
    .from("site_languages")
    .select("code, is_default")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!language) {
    return { ok: false, error: "Valoda nav atrasta." };
  }

  if (language.is_default === true) {
    return { ok: false, error: "Noklusējuma valodu nevar dzēst." };
  }

  const defaultCode = await getDefaultSiteLanguageCode();
  await supabase
    .from("users")
    .update({ active_language_code: defaultCode })
    .eq("active_language_code", normalizedCode);
  await migrateTranslationLanguageCode(supabase, normalizedCode, null);

  const { error } = await supabase
    .from("site_languages")
    .delete()
    .eq("code", normalizedCode);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst valodu." };
  }

  return { ok: true };
}

export async function setDefaultSiteLanguage(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedCode = normalizeLanguageCode(code);

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data: language } = await supabase
    .from("site_languages")
    .select("code")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!language) {
    return { ok: false, error: "Valoda nav atrasta." };
  }

  await supabase
    .from("site_languages")
    .update({ is_default: false })
    .eq("is_default", true);

  const { error } = await supabase
    .from("site_languages")
    .update({ is_default: true, is_active: true })
    .eq("code", normalizedCode);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt noklusējuma valodu." };
  }

  return { ok: true };
}

export async function listSiteTranslations(): Promise<SiteTranslationSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_translations")
    .select("translation_key, namespace, description, values, updated_at")
    .order("namespace", { ascending: true })
    .order("translation_key", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as SiteTranslationRow[]).map(mapTranslationRow);
}

async function getSiteTranslationDictionaryUncached(
  languageCode: string,
  _cacheVersion?: string,
): Promise<TranslationDictionary> {
  if (!isSupabaseAdminConfigured()) {
    return {};
  }

  const [defaultCode, translations] = await Promise.all([
    getDefaultSiteLanguageCode(),
    listSiteTranslations(),
  ]);
  const normalizedCode = normalizeLanguageCode(languageCode || defaultCode);

  return Object.fromEntries(
    translations.map((translation) => {
      const activeValue = translation.values[normalizedCode]?.trim();
      const defaultValue = translation.values[defaultCode]?.trim();

      return [
        translation.key,
        activeValue || defaultValue || translation.key,
      ];
    }),
  );
}

const getCachedSiteTranslationDictionary = unstable_cache(
  getSiteTranslationDictionaryUncached,
  ["site-translation-dictionary"],
  { tags: [SITE_TRANSLATIONS_CACHE_TAG] },
);

async function getSiteTranslationsCacheVersionUncached(): Promise<string> {
  if (!isSupabaseAdminConfigured()) {
    return "unconfigured";
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_translations")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return "empty";
  }

  return String(data.updated_at ?? "empty");
}

const getCachedSiteTranslationsCacheVersion = unstable_cache(
  getSiteTranslationsCacheVersionUncached,
  ["site-translations-cache-version"],
  { tags: [SITE_TRANSLATIONS_CACHE_TAG], revalidate: 60 },
);

export async function getSiteTranslationDictionary(
  languageCode: string,
): Promise<TranslationDictionary> {
  const cacheVersion = await getCachedSiteTranslationsCacheVersion();
  return getCachedSiteTranslationDictionary(languageCode, cacheVersion);
}

export async function createSiteTranslation(
  input: SiteTranslationInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = normalizeTranslationKey(input.key);
  const keyError = validateTranslationKey(key);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_translations").insert({
    translation_key: key,
    namespace: input.namespace.trim(),
    description: input.description.trim(),
    values: normalizeTranslationValues(input.values),
  });

  if (error) {
    const message = error.message.toLowerCase();
    return {
      ok: false,
      error: message.includes("duplicate") || message.includes("already")
        ? "Tulkojums ar šo key jau eksistē."
        : "Neizdevās izveidot tulkojumu.",
    };
  }

  return { ok: true };
}

export async function updateSiteTranslation(
  currentKey: string,
  input: SiteTranslationInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const oldKey = normalizeTranslationKey(currentKey);
  const nextKey = normalizeTranslationKey(input.key);
  const keyError = validateTranslationKey(nextKey);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  if (!oldKey) {
    return { ok: false, error: "Tulkojums nav norādīts." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();

  if (oldKey !== nextKey) {
    const { data: existing } = await supabase
      .from("site_translations")
      .select("translation_key")
      .eq("translation_key", nextKey)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: "Tulkojums ar šo key jau eksistē." };
    }
  }

  const { error } = await supabase
    .from("site_translations")
    .update({
      translation_key: nextKey,
      namespace: input.namespace.trim(),
      description: input.description.trim(),
      values: normalizeTranslationValues(input.values),
    })
    .eq("translation_key", oldKey);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt tulkojumu." };
  }

  return { ok: true };
}

export async function deleteSiteTranslation(
  key: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedKey = normalizeTranslationKey(key);
  if (!normalizedKey) {
    return { ok: false, error: "Tulkojums nav norādīts." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_translations")
    .delete()
    .eq("translation_key", normalizedKey);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst tulkojumu." };
  }

  return { ok: true };
}

export async function getDefaultSiteLanguageCode(): Promise<string> {
  const languages = await listSiteLanguages({ activeOnly: true });
  return (
    languages.find((language) => language.isDefault)?.code ??
    languages[0]?.code ??
    "lv"
  );
}

export async function getUserActiveLanguageCode(
  userId: string,
): Promise<string> {
  if (!isSupabaseAdminConfigured()) {
    return "lv";
  }

  const languages = await listSiteLanguages({ activeOnly: true });
  const defaultCode =
    languages.find((language) => language.isDefault)?.code ??
    languages[0]?.code ??
    "lv";
  const activeCodes = new Set(languages.map((language) => language.code));

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("active_language_code")
    .eq("id", userId)
    .maybeSingle();

  const code =
    !error && typeof data?.active_language_code === "string"
      ? data.active_language_code
      : "";

  return activeCodes.has(code) ? code : defaultCode;
}

export async function updateUserActiveLanguageCode({
  userId,
  email,
  name,
  avatarUrl,
  code,
}: {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return { ok: false, error: "Valoda nav norādīta." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const languages = await listSiteLanguages({ activeOnly: true });
  if (!languages.some((language) => language.code === trimmedCode)) {
    return { ok: false, error: "Valoda nav atrasta vai nav aktīva." };
  }

  const supabase = createAdminClient();
  const { data: updatedRows, error: updateError } = await supabase
    .from("users")
    .update({ active_language_code: trimmedCode })
    .eq("id", userId)
    .select("id");

  if (updateError) {
    return { ok: false, error: "Neizdevās saglabāt valodu." };
  }

  if ((updatedRows ?? []).length > 0) {
    return { ok: true };
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: userId,
    email,
    name,
    avatar_url: avatarUrl,
    is_admin: false,
    active_language_code: trimmedCode,
  });

  if (insertError) {
    return { ok: false, error: "Neizdevās saglabāt valodu." };
  }

  return { ok: true };
}

const SITE_SETTINGS_COLUMNS =
  "id, system_name, slogan, controller_name, controller_registration_number, controller_address, controller_email, logo_url, favicon_url, updated_at";

function mapGlobalSiteSettingsRow(row: GlobalSiteSettingsRow): SiteSettingsSummary {
  return {
    systemName: row.system_name,
    slogan: row.slogan,
    controllerName: row.controller_name ?? "",
    controllerRegistrationNumber: row.controller_registration_number ?? "",
    controllerAddress: row.controller_address ?? "",
    controllerEmail: row.controller_email ?? "",
    logoUrl: resolveSiteBrandingDisplayUrl("logo", row.logo_url ?? ""),
    faviconUrl: resolveSiteBrandingDisplayUrl("favicon", row.favicon_url ?? ""),
    updatedAt: row.updated_at,
  };
}

async function getSiteSettingsUncached(): Promise<SiteSettingsSummary> {
  if (!isSupabaseAdminConfigured()) {
    return DEFAULT_SITE_SETTINGS;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select(SITE_SETTINGS_COLUMNS)
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_SITE_SETTINGS;
  }

  return mapGlobalSiteSettingsRow(data as GlobalSiteSettingsRow);
}

const getCachedSiteSettings = unstable_cache(
  getSiteSettingsUncached,
  ["site-settings"],
  { tags: [SITE_SETTINGS_CACHE_TAG] },
);

export async function getSiteSettings(): Promise<SiteSettingsSummary> {
  return getCachedSiteSettings();
}

export async function saveSiteSettings(
  settings: SiteSettingsInput,
): Promise<{ ok: true; settings: SiteSettingsSummary } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const systemName = settings.systemName.trim();
  const slogan = settings.slogan.trim();
  const controllerName = settings.controllerName.trim();
  const controllerRegistrationNumber = settings.controllerRegistrationNumber.trim();
  const controllerAddress = settings.controllerAddress.trim();
  const controllerEmail = settings.controllerEmail.trim();

  if (!systemName) {
    return { ok: false, error: "Ievadi sistēmas nosaukumu." };
  }

  if (!slogan) {
    return { ok: false, error: "Ievadi sistēmas sloganu." };
  }

  if (controllerEmail && !isValidEmail(controllerEmail)) {
    return { ok: false, error: "Ievadi derīgu pārziņa e-pasta adresi." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        id: 1,
        system_name: systemName,
        slogan,
        controller_name: controllerName,
        controller_registration_number: controllerRegistrationNumber,
        controller_address: controllerAddress,
        controller_email: controllerEmail,
      },
      { onConflict: "id" },
    )
    .select(SITE_SETTINGS_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās saglabāt sistēmas uzstādījumus." };
  }

  return {
    ok: true,
    settings: mapGlobalSiteSettingsRow(data as GlobalSiteSettingsRow),
  };
}

export async function updateSiteBrandingUrl(
  kind: SiteBrandingAssetKind,
  url: string,
): Promise<{ ok: true; settings: SiteSettingsSummary } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const sanitized = sanitizeSiteBrandingUrl(kind, url);
  const supabase = createAdminClient();
  const current = await getSiteSettingsUncached();

  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        id: 1,
        system_name: current.systemName,
        slogan: current.slogan,
        controller_name: current.controllerName,
        controller_registration_number: current.controllerRegistrationNumber,
        controller_address: current.controllerAddress,
        controller_email: current.controllerEmail,
        logo_url:
          kind === "logo"
            ? sanitized
            : sanitizeSiteBrandingUrl("logo", current.logoUrl),
        favicon_url:
          kind === "favicon"
            ? sanitized
            : sanitizeSiteBrandingUrl("favicon", current.faviconUrl),
      },
      { onConflict: "id" },
    )
    .select(SITE_SETTINGS_COLUMNS)
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        kind === "logo"
          ? "Neizdevās saglabāt logotipu."
          : "Neizdevās saglabāt favicon.",
    };
  }

  return {
    ok: true,
    settings: mapGlobalSiteSettingsRow(data as GlobalSiteSettingsRow),
  };
}

export async function listSiteSettings(): Promise<SiteSettingsSummary[]> {
  const settings = await getSiteSettings();
  return [settings];
}

function mapSiteDocRow(row: SiteDocRow): SiteDocSummary {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function mapSiteDocCategoryRow(
  row: SiteDocCategoryRow,
  docs: SiteDocSummary[],
): SiteDocCategorySummary {
  return {
    id: row.id,
    title: row.title,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    docs,
  };
}

async function listSiteDocsUncached(): Promise<SiteDocCategorySummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return DEFAULT_SITE_DOC_CATEGORIES;
  }

  const supabase = createAdminClient();
  const [categoriesResult, docsResult] = await Promise.all([
    supabase
      .from("site_doc_categories")
      .select("id, title, sort_order, updated_at")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
    supabase
      .from("site_docs")
      .select("id, category_id, title, description, sort_order, updated_at")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
  ]);

  if (categoriesResult.error || docsResult.error || !categoriesResult.data || !docsResult.data) {
    return DEFAULT_SITE_DOC_CATEGORIES;
  }

  const docs = (docsResult.data as SiteDocRow[]).map(mapSiteDocRow);
  const docsByCategory = new Map<string, SiteDocSummary[]>();
  docs.forEach((doc) => {
    const categoryDocs = docsByCategory.get(doc.categoryId) ?? [];
    categoryDocs.push(doc);
    docsByCategory.set(doc.categoryId, categoryDocs);
  });

  return (categoriesResult.data as SiteDocCategoryRow[]).map((category) =>
    mapSiteDocCategoryRow(category, docsByCategory.get(category.id) ?? []),
  );
}

const getCachedSiteDocs = unstable_cache(
  listSiteDocsUncached,
  ["site-docs"],
  { tags: [SITE_DOCS_CACHE_TAG] },
);

export async function listSiteDocs(): Promise<SiteDocCategorySummary[]> {
  return getCachedSiteDocs();
}

export async function createSiteDocCategory(
  input: SiteDocCategoryInput,
): Promise<{ ok: true; category: SiteDocCategorySummary } | { ok: false; error: string }> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Ievadi kategorijas nosaukumu." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const existingCategories = await listSiteDocsUncached();
  const nextSortOrder =
    Math.max(0, ...existingCategories.map((category) => category.sortOrder)) + 10;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_doc_categories")
    .insert({ title, sort_order: nextSortOrder })
    .select("id, title, sort_order, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās izveidot dokumentācijas kategoriju." };
  }

  return {
    ok: true,
    category: mapSiteDocCategoryRow(data as SiteDocCategoryRow, []),
  };
}

export async function updateSiteDocCategory(
  categoryId: string,
  input: SiteDocCategoryInput,
): Promise<{ ok: true; category: SiteDocCategorySummary } | { ok: false; error: string }> {
  const id = categoryId.trim();
  const title = input.title.trim();
  if (!id) {
    return { ok: false, error: "Kategorija nav norādīta." };
  }
  if (!title) {
    return { ok: false, error: "Ievadi kategorijas nosaukumu." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_doc_categories")
    .update({ title })
    .eq("id", id)
    .select("id, title, sort_order, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās saglabāt dokumentācijas kategoriju." };
  }

  return {
    ok: true,
    category: mapSiteDocCategoryRow(data as SiteDocCategoryRow, []),
  };
}

export async function deleteSiteDocCategory(
  categoryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = categoryId.trim();
  if (!id) {
    return { ok: false, error: "Kategorija nav norādīta." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_doc_categories")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst dokumentācijas kategoriju." };
  }

  return { ok: true };
}

export async function createSiteDoc(
  input: SiteDocInput,
): Promise<{ ok: true; doc: SiteDocSummary } | { ok: false; error: string }> {
  const categoryId = input.categoryId.trim();
  const title = input.title.trim();
  const description = input.description.trim();
  if (!categoryId) {
    return { ok: false, error: "Kategorija nav norādīta." };
  }
  if (!title) {
    return { ok: false, error: "Ievadi dokumenta nosaukumu." };
  }
  if (!description) {
    return { ok: false, error: "Ievadi dokumenta aprakstu." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const existingCategories = await listSiteDocsUncached();
  const category = existingCategories.find((item) => item.id === categoryId);
  if (!category) {
    return { ok: false, error: "Kategorija nav atrasta." };
  }

  const nextSortOrder = Math.max(0, ...category.docs.map((doc) => doc.sortOrder)) + 10;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_docs")
    .insert({
      category_id: categoryId,
      title,
      description,
      sort_order: nextSortOrder,
    })
    .select("id, category_id, title, description, sort_order, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās izveidot dokumentu." };
  }

  return { ok: true, doc: mapSiteDocRow(data as SiteDocRow) };
}

export async function updateSiteDoc(
  docId: string,
  input: SiteDocInput,
): Promise<{ ok: true; doc: SiteDocSummary } | { ok: false; error: string }> {
  const id = docId.trim();
  const categoryId = input.categoryId.trim();
  const title = input.title.trim();
  const description = input.description.trim();
  if (!id) {
    return { ok: false, error: "Dokuments nav norādīts." };
  }
  if (!categoryId) {
    return { ok: false, error: "Kategorija nav norādīta." };
  }
  if (!title) {
    return { ok: false, error: "Ievadi dokumenta nosaukumu." };
  }
  if (!description) {
    return { ok: false, error: "Ievadi dokumenta aprakstu." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_docs")
    .update({ category_id: categoryId, title, description })
    .eq("id", id)
    .select("id, category_id, title, description, sort_order, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās saglabāt dokumentu." };
  }

  return { ok: true, doc: mapSiteDocRow(data as SiteDocRow) };
}

export async function deleteSiteDoc(
  docId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = docId.trim();
  if (!id) {
    return { ok: false, error: "Dokuments nav norādīts." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_docs").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst dokumentu." };
  }

  return { ok: true };
}

export async function reorderSiteDocs(
  items: SiteDocReorderItem[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const normalizedItems = items
    .map((item) => ({
      id: item.id.trim(),
      categoryId: item.categoryId.trim(),
      sortOrder: Number.isFinite(item.sortOrder) ? Math.trunc(item.sortOrder) : 0,
    }))
    .filter((item) => item.id && item.categoryId && item.sortOrder > 0);

  if (normalizedItems.length !== items.length) {
    return { ok: false, error: "Dokumentu secība nav derīga." };
  }

  const supabase = createAdminClient();
  const updates = await Promise.all(
    normalizedItems.map((item) =>
      supabase
        .from("site_docs")
        .update({ category_id: item.categoryId, sort_order: item.sortOrder })
        .eq("id", item.id),
    ),
  );

  if (updates.some((result) => result.error)) {
    return { ok: false, error: "Neizdevās saglabāt dokumentu secību." };
  }

  return { ok: true };
}
