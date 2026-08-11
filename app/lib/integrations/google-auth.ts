import { unstable_cache } from "next/cache";
import { SITE_SETTINGS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  getSupabasePublicEnv,
  isSupabaseAdminConfigured,
} from "@/app/lib/supabase/env";

export type GoogleAuthSettingsPublic = {
  enabled: boolean;
  allowedEmailDomain: string;
  clientIdDisplay: string;
  /** From NEXT_PUBLIC_SITE_URL (no trailing slash). */
  siteUrl: string;
  appCallbackUrl: string;
  appConfirmUrl: string;
  /** Google Cloud Console redirect URI pointing at Supabase Auth. */
  supabaseGoogleCallbackUrl: string;
  /** True when NEXT_PUBLIC_SUPABASE_URL is not *.supabase.co (custom domain). */
  usesCustomSupabaseDomain: boolean;
  /** Hostname currently used for Auth (e.g. xxx.supabase.co or api.uupis.com). */
  supabaseHost: string;
  /** Planned branded Auth host after Pro Custom Domain. */
  plannedCustomApiHost: string;
  /** Future Google Cloud redirect URI once Custom Domain is active. */
  plannedGoogleCallbackUrl: string;
  hasEnvAllowedDomain: boolean;
};

export type GoogleAuthSettingsInput = {
  enabled: boolean;
  allowedEmailDomain: string;
  clientIdDisplay: string;
};

type GoogleAuthSettingsRow = {
  google_auth_enabled: boolean | null;
  google_allowed_email_domain: string | null;
  google_client_id_display: string | null;
};

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() ?? "";
}

function envAllowedDomain(): string {
  return process.env.ALLOWED_EMAIL_DOMAIN?.trim() ?? "";
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/^\.+/, "");
}

async function loadGoogleAuthSettingsRow(): Promise<GoogleAuthSettingsRow | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "google_auth_enabled, google_allowed_email_domain, google_client_id_display",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as GoogleAuthSettingsRow;
}

function mapPublic(
  row: GoogleAuthSettingsRow | null,
): GoogleAuthSettingsPublic {
  const siteUrl = siteOrigin();
  const supabaseUrl = getSupabasePublicEnv()?.url.replace(/\/$/, "") ?? "";
  let supabaseHost = "";
  try {
    supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "";
  } catch {
    supabaseHost = "";
  }
  const usesCustomSupabaseDomain =
    supabaseHost.length > 0 && !supabaseHost.endsWith(".supabase.co");
  const plannedCustomApiHost = "api.uupis.com";

  return {
    enabled: row?.google_auth_enabled !== false,
    allowedEmailDomain: normalizeDomain(
      row?.google_allowed_email_domain ?? "",
    ),
    clientIdDisplay: (row?.google_client_id_display ?? "").trim(),
    siteUrl,
    appCallbackUrl: siteUrl ? `${siteUrl}/auth/callback` : "",
    appConfirmUrl: siteUrl ? `${siteUrl}/auth/confirm` : "",
    supabaseGoogleCallbackUrl: supabaseUrl
      ? `${supabaseUrl}/auth/v1/callback`
      : "",
    usesCustomSupabaseDomain,
    supabaseHost,
    plannedCustomApiHost,
    plannedGoogleCallbackUrl: `https://${plannedCustomApiHost}/auth/v1/callback`,
    hasEnvAllowedDomain: envAllowedDomain().length > 0,
  };
}

const getCachedGoogleAuthSettingsPublic = unstable_cache(
  async (): Promise<GoogleAuthSettingsPublic> => {
    const row = await loadGoogleAuthSettingsRow();
    return mapPublic(row);
  },
  ["site-google-auth-settings-public"],
  { tags: [SITE_SETTINGS_CACHE_TAG] },
);

export async function getGoogleAuthSettingsPublic(): Promise<GoogleAuthSettingsPublic> {
  return getCachedGoogleAuthSettingsPublic();
}

export async function isGoogleAuthEnabled(): Promise<boolean> {
  const settings = await getGoogleAuthSettingsPublic();
  return settings.enabled;
}

/**
 * Domain restriction for Google login. DB value wins when set; else env.
 */
export async function resolveAllowedEmailDomain(): Promise<string | null> {
  const row = await loadGoogleAuthSettingsRow();
  const fromDb = normalizeDomain(row?.google_allowed_email_domain ?? "");
  if (fromDb) {
    return fromDb;
  }
  const fromEnv = normalizeDomain(envAllowedDomain());
  return fromEnv || null;
}

export async function saveGoogleAuthSettings(
  input: GoogleAuthSettingsInput,
): Promise<
  | { ok: true; settings: GoogleAuthSettingsPublic }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const allowedEmailDomain = normalizeDomain(input.allowedEmailDomain);
  const clientIdDisplay = input.clientIdDisplay.trim();
  const enabled = input.enabled === true;

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      id: 1,
      google_auth_enabled: enabled,
      google_allowed_email_domain: allowedEmailDomain,
      google_client_id_display: clientIdDisplay,
    },
    { onConflict: "id" },
  );

  if (error) {
    return {
      ok: false,
      error: "Neizdevās saglabāt Google autentifikācijas iestatījumus.",
    };
  }

  return {
    ok: true,
    settings: mapPublic({
      google_auth_enabled: enabled,
      google_allowed_email_domain: allowedEmailDomain,
      google_client_id_display: clientIdDisplay,
    }),
  };
}
