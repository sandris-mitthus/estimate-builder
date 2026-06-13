import type { User } from "@supabase/supabase-js";
import { mapUserDisplay, readAvatarUrl } from "@/app/lib/auth/map-user-display";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";
import { SAMPLE_USERS } from "@/app/lib/users/sample-users";
import type { UserSummary } from "@/app/lib/users/types";

function resolveAvatarUrl(user: User): string | null {
  const { avatarUrl } = mapUserDisplay(user);
  if (avatarUrl) return avatarUrl;

  // Dažiem Google OAuth lietotājiem avatars ir tikai identities datos.
  for (const identity of user.identities ?? []) {
    const data = identity.identity_data ?? {};
    const url = readAvatarUrl(data as Record<string, unknown>);
    if (url) return url;
  }

  return null;
}

function mapAuthUser(user: User): UserSummary {
  const { name } = mapUserDisplay(user);

  return {
    id: user.id,
    name,
    email: user.email ?? "—",
    avatarUrl: resolveAvatarUrl(user),
  };
}

export async function listUsers(): Promise<UserSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_USERS;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return [];
  }

  if (!data.users.length) {
    return [];
  }

  return data.users
    .map(mapAuthUser)
    .sort((a, b) => a.name.localeCompare(b.name, "lv"));
}

function inviteRedirectUrl(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3100";

  return `${siteUrl}/auth/callback`;
}

export async function inviteUser(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const emailError = validateRequiredEmail(email);
  if (emailError) {
    return { ok: false, error: emailError };
  }

  const trimmed = email.trim().toLowerCase();

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.inviteUserByEmail(trimmed, {
    redirectTo: inviteRedirectUrl(),
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("exists")
    ) {
      return {
        ok: false,
        error: "Lietotājs ar šo e-pastu jau ir reģistrēts.",
      };
    }

    return { ok: false, error: "Neizdevās nosūtīt uzaicinājumu." };
  }

  return { ok: true };
}
