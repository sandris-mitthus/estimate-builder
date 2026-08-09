import { unstable_cache } from "next/cache";
import { SITE_SETTINGS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

const getCachedLandingPageEnabled = unstable_cache(
  async (): Promise<boolean> => {
    if (!isSupabaseAdminConfigured()) {
      return true;
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("landing_enabled")
      .eq("id", 1)
      .maybeSingle();

    // Default to showing the landing page when the row or column is missing.
    if (error || !data) {
      return true;
    }

    return data.landing_enabled !== false;
  },
  ["site-landing-enabled"],
  { tags: [SITE_SETTINGS_CACHE_TAG] },
);

export async function isLandingPageEnabled(): Promise<boolean> {
  return getCachedLandingPageEnabled();
}

export async function setLandingPageEnabled(
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: 1, landing_enabled: enabled === true }, { onConflict: "id" });

  if (error) {
    return {
      ok: false,
      error: "Neizdevās saglabāt landing page iestatījumu.",
    };
  }

  return { ok: true };
}
