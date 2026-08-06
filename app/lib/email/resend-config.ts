import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { SITE_SETTINGS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import { unstable_cache } from "next/cache";

export type ResendSettingsPublic = {
  enabled: boolean;
  emailFrom: string;
  /** True when a key is stored in site_settings (value never exposed). */
  hasStoredApiKey: boolean;
  /** True when RESEND_API_KEY is set in the server environment. */
  hasEnvApiKey: boolean;
};

export type ResendSettingsInput = {
  enabled: boolean;
  emailFrom: string;
  /** Empty string keeps the existing stored key. */
  apiKey: string;
};

export type ResolvedResendConfig = {
  enabled: boolean;
  apiKey: string;
  from: string;
};

type ResendSettingsRow = {
  resend_enabled: boolean | null;
  email_from: string | null;
  resend_api_key: string | null;
};

function envApiKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

function envFrom(): string {
  return process.env.EMAIL_FROM?.trim() ?? "";
}

async function loadResendSettingsRow(): Promise<ResendSettingsRow | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("resend_enabled, email_from, resend_api_key")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ResendSettingsRow;
}

const getCachedResendSettingsPublic = unstable_cache(
  async (): Promise<ResendSettingsPublic> => {
    const row = await loadResendSettingsRow();
    const storedKey = row?.resend_api_key?.trim() ?? "";
    return {
      enabled: row?.resend_enabled === true,
      emailFrom: (row?.email_from ?? "").trim() || envFrom(),
      hasStoredApiKey: storedKey.length > 0,
      hasEnvApiKey: envApiKey().length > 0,
    };
  },
  ["site-resend-settings-public"],
  { tags: [SITE_SETTINGS_CACHE_TAG] },
);

export async function getResendSettingsPublic(): Promise<ResendSettingsPublic> {
  return getCachedResendSettingsPublic();
}

/**
 * Resolves credentials for sending. Prefer DB values; fall back to env.
 * Returns null when Resend is off or incomplete.
 */
export async function resolveResendConfig(): Promise<ResolvedResendConfig | null> {
  const row = await loadResendSettingsRow();
  const enabled = row?.resend_enabled === true;
  if (!enabled) {
    return null;
  }

  const apiKey = (row?.resend_api_key?.trim() || envApiKey()).trim();
  const from = (row?.email_from?.trim() || envFrom()).trim();
  if (!apiKey || !from) {
    return null;
  }

  return { enabled: true, apiKey, from };
}

export async function saveResendSettings(
  input: ResendSettingsInput,
): Promise<
  | { ok: true; settings: ResendSettingsPublic }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const emailFrom = input.emailFrom.trim();
  const apiKeyInput = input.apiKey.trim();
  const enabled = input.enabled === true;

  if (enabled && !emailFrom) {
    return {
      ok: false,
      error: "Ievadi sūtītāja adresi, lai ieslēgtu Resend.",
    };
  }

  const supabase = createAdminClient();
  const existing = await loadResendSettingsRow();
  const storedKey = existing?.resend_api_key?.trim() ?? "";
  const nextKey = apiKeyInput || storedKey;

  if (enabled && !nextKey && !envApiKey()) {
    return {
      ok: false,
      error:
        "Ievadi Resend API atslēgu vai iestati RESEND_API_KEY vidē.",
    };
  }

  const payload: Record<string, unknown> = {
    id: 1,
    resend_enabled: enabled,
    email_from: emailFrom,
  };
  if (apiKeyInput) {
    payload.resend_api_key = apiKeyInput;
  }

  const { error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt Resend iestatījumus." };
  }

  return {
    ok: true,
    settings: {
      enabled,
      emailFrom,
      hasStoredApiKey: (apiKeyInput || storedKey).length > 0,
      hasEnvApiKey: envApiKey().length > 0,
    },
  };
}
