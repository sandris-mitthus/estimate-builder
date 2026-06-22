import { mapUserDisplay, resolveAvatarUrl } from "@/app/lib/auth/map-user-display";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";
import { SAMPLE_USERS } from "@/app/lib/users/sample-users";
import type { UserSummary } from "@/app/lib/users/types";

type UserProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
};

function normalizeCompanyStatus(value: unknown): UserSummary["companyStatus"] {
  return value === "invited" || value === "disabled" ? value : "active";
}

function mapUserProfile(
  row: UserProfileRow | undefined,
  userId: string,
  companyStatus: UserSummary["companyStatus"],
): UserSummary {
  const email = row?.email?.trim() || "—";
  const name = row?.name?.trim() || (email !== "—" ? email.split("@")[0] : "—");

  return {
    id: userId,
    name,
    email,
    avatarUrl: row?.avatar_url?.trim() || null,
    companyStatus,
  };
}

export async function listUsers(): Promise<UserSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_USERS;
  }

  const supabase = createAdminClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("company_users")
    .select("user_id, status")
    .eq("company_id", companyId);

  if (membershipError || !memberships) {
    return [];
  }

  const companyStatusByUserId = new Map(
    memberships.map((membership) => [
      membership.user_id as string,
      normalizeCompanyStatus(membership.status),
    ]),
  );
  const userIds = Array.from(companyStatusByUserId.keys());

  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("users")
    .select("id, email, name, avatar_url")
    .in("id", userIds);

  if (profilesError || !profiles) {
    return [];
  }

  const profileByUserId = new Map(
    (profiles as UserProfileRow[]).map((profile) => [profile.id, profile]),
  );
  const users = userIds.map((userId) =>
    mapUserProfile(
      profileByUserId.get(userId),
      userId,
      companyStatusByUserId.get(userId) ?? "active",
    ),
  );

  return users.sort((a, b) => a.name.localeCompare(b.name, "lv"));
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
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(trimmed, {
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

  if (data.user?.id) {
    const profile = {
      id: data.user.id,
      email: data.user.email ?? trimmed,
      name: mapUserDisplay(data.user).name,
      avatar_url: resolveAvatarUrl(data.user) ?? "",
    };
    const { error: profileInsertError } = await supabase.from("users").insert({
      ...profile,
      is_admin: false,
    });

    if (profileInsertError) {
      await supabase.from("users").update(profile).eq("id", data.user.id);
    }

    await supabase.from("company_users").upsert(
      {
        company_id: companyId,
        user_id: data.user.id,
        role: "member",
        status: "invited",
      },
      { onConflict: "company_id,user_id" },
    );
  }

  return { ok: true };
}

export async function updateCompanyUserStatus(
  userId: string,
  status: Extract<UserSummary["companyStatus"], "active" | "disabled">,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return { ok: false, error: "Lietotājs nav norādīts." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("company_users")
    .update({ status })
    .eq("company_id", companyId)
    .eq("user_id", trimmedUserId);

  if (error) {
    return {
      ok: false,
      error:
        status === "disabled"
          ? "Neizdevās liegt pieeju lietotājam."
          : "Neizdevās atjaunot lietotāja pieeju.",
    };
  }

  return { ok: true };
}

export async function removeCompanyUser(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return { ok: false, error: "Lietotājs nav norādīts." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("company_users")
    .delete()
    .eq("company_id", companyId)
    .eq("user_id", trimmedUserId);

  if (error) {
    return { ok: false, error: "Neizdevās noņemt lietotāju no uzņēmuma." };
  }

  return { ok: true };
}
