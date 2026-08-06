import { mapUserDisplay, resolveAvatarUrl } from "@/app/lib/auth/map-user-display";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { resolveResendConfig } from "@/app/lib/email/resend-config";
import { sendCompanyAccessNotice } from "@/app/lib/email/send-company-access-notice";
import { sendCompanyInviteNotice } from "@/app/lib/email/send-company-invite-notice";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  getSupabasePublicEnv,
  isSupabaseAdminConfigured,
} from "@/app/lib/supabase/env";
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

export const listUsers = cache(async function listUsers(): Promise<UserSummary[]> {
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
});

function inviteRedirectUrl(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3100";

  // Invite links use hash tokens (PKCE is not supported for inviteUserByEmail).
  // /auth/confirm completes the session on the client via setSession.
  return `${siteUrl}/auth/confirm`;
}

type InviteUserResult =
  | { ok: true; mode: "invited" }
  | { ok: false; error: string };

async function findAuthUserByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<{ id: string; email: string; name: string; avatarUrl: string | null } | null> {
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, avatar_url")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (profile && typeof profile.id === "string") {
    return {
      id: profile.id,
      email: (profile.email as string | null)?.trim() || email,
      name: (profile.name as string | null)?.trim() || email.split("@")[0] || email,
      avatarUrl: (profile.avatar_url as string | null)?.trim() || null,
    };
  }

  // Auth-only accounts (e.g. Google) may not yet have a public.users row.
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error || !data?.users?.length) {
      return null;
    }

    const found = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    );
    if (found) {
      return {
        id: found.id,
        email: found.email?.trim().toLowerCase() || email,
        name: mapUserDisplay(found).name,
        avatarUrl: resolveAvatarUrl(found) ?? null,
      };
    }

    if (data.users.length < 200 || page >= 25) {
      return null;
    }
    page += 1;
  }
}

async function ensureUserProfile(
  supabase: ReturnType<typeof createAdminClient>,
  user: { id: string; email: string; name: string; avatarUrl: string | null },
) {
  const profile = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatarUrl ?? "",
  };
  const { error: insertError } = await supabase.from("users").insert({
    ...profile,
    is_admin: false,
  });

  if (insertError) {
    await supabase.from("users").update(profile).eq("id", user.id);
  }
}

async function attachInvitedMembership(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("company_users").upsert(
    {
      company_id: companyId,
      user_id: userId,
      role: "member",
      status: "invited",
    },
    { onConflict: "company_id,user_id" },
  );

  if (error) {
    return { ok: false, error: "Neizdevās pievienot lietotāju uzņēmumam." };
  }

  return { ok: true };
}

function isEmailAlreadyRegisteredError(error: {
  message?: string;
  code?: string;
}): boolean {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  return (
    code === "email_exists" ||
    message.includes("already") ||
    message.includes("registered") ||
    message.includes("exists")
  );
}

function isEmailRateLimitError(error: {
  message?: string;
  code?: string;
}): boolean {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  return (
    code === "over_email_send_rate_limit" ||
    message.includes("rate limit")
  );
}

/**
 * Sends the invite / confirmation email.
 * - Resend enabled: generateLink + custom HTML template via Resend.
 * - Otherwise: Supabase Auth invite / magic-link templates.
 */
async function sendCompanyInviteEmail(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const redirectTo = inviteRedirectUrl();
  const admin = createAdminClient();
  const resendConfig = await resolveResendConfig();

  if (resendConfig) {
    const inviteLink = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });

    let actionLink = inviteLink.data?.properties?.action_link?.trim() ?? "";

    if (inviteLink.error || !actionLink) {
      if (
        inviteLink.error &&
        !isEmailAlreadyRegisteredError(inviteLink.error)
      ) {
        if (isEmailRateLimitError(inviteLink.error)) {
          return {
            ok: false,
            error:
              "Uzaicinājuma e-pastu var sūtīt pārāk bieži. Uzgaidi minūti un mēģini vēlreiz.",
          };
        }
        return { ok: false, error: "Neizdevās nosūtīt uzaicinājumu." };
      }

      const magic = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

      actionLink = magic.data?.properties?.action_link?.trim() ?? "";
      if (magic.error || !actionLink) {
        if (magic.error && isEmailRateLimitError(magic.error)) {
          return {
            ok: false,
            error:
              "Uzaicinājuma e-pastu var sūtīt pārāk bieži. Uzgaidi minūti un mēģini vēlreiz.",
          };
        }
        return { ok: false, error: "Neizdevās nosūtīt uzaicinājumu." };
      }
    }

    return sendCompanyInviteNotice({
      email,
      inviteLink: actionLink,
    });
  }

  const invite = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (!invite.error) {
    return { ok: true };
  }

  if (!isEmailAlreadyRegisteredError(invite.error)) {
    if (isEmailRateLimitError(invite.error)) {
      return {
        ok: false,
        error:
          "Uzaicinājuma e-pastu var sūtīt pārāk bieži. Uzgaidi minūti un mēģini vēlreiz.",
      };
    }
    return { ok: false, error: "Neizdevās nosūtīt uzaicinājumu." };
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  // Service-role OTP is unreliable for delivery; use the anon client like a normal
  // passwordless sign-in so GoTrue actually sends the Magic Link mail.
  const publicClient = createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const otp = await publicClient.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });

  if (!otp.error) {
    return { ok: true };
  }

  if (isEmailRateLimitError(otp.error)) {
    return {
      ok: false,
      error:
        "Uzaicinājuma e-pastu var sūtīt pārāk bieži. Uzgaidi minūti un mēģini vēlreiz.",
    };
  }

  return { ok: false, error: "Neizdevās nosūtīt uzaicinājumu." };
}

export async function inviteUser(email: string): Promise<InviteUserResult> {
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

  const existing = await findAuthUserByEmail(supabase, trimmed);

  if (existing) {
    const { data: membership } = await supabase
      .from("company_users")
      .select("user_id, status")
      .eq("company_id", companyId)
      .eq("user_id", existing.id)
      .maybeSingle();

    if (membership) {
      const status = normalizeCompanyStatus(membership.status);
      if (status === "active") {
        return {
          ok: false,
          error: "Lietotājs jau ir šajā uzņēmumā.",
        };
      }

      // invited — only resend the confirmation email (do not block retries).
      if (status === "invited") {
        const emailed = await sendCompanyInviteEmail(trimmed);
        if (!emailed.ok) {
          return emailed;
        }
        return { ok: true, mode: "invited" };
      }
      // disabled — re-invite below.
    }

    await ensureUserProfile(supabase, existing);

    const attached = await attachInvitedMembership(
      supabase,
      companyId,
      existing.id,
    );
    if (!attached.ok) {
      return attached;
    }

    const emailed = await sendCompanyInviteEmail(trimmed);
    if (!emailed.ok) {
      return emailed;
    }

    return { ok: true, mode: "invited" };
  }

  // Brand-new Auth user: invite creates the account and sends the Invite email.
  const emailed = await sendCompanyInviteEmail(trimmed);
  if (!emailed.ok) {
    return emailed;
  }

  const created = await findAuthUserByEmail(supabase, trimmed);
  if (!created) {
    return { ok: false, error: "Neizdevās nosūtīt uzaicinājumu." };
  }

  await ensureUserProfile(supabase, created);
  const attached = await attachInvitedMembership(
    supabase,
    companyId,
    created.id,
  );
  if (!attached.ok) {
    return attached;
  }

  return { ok: true, mode: "invited" };
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

  await sendCompanyAccessNotice(
    trimmedUserId,
    status === "disabled" ? "disabled" : "restored",
  );

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

  // Drop group membership first so a removed user cannot retain nav/action rights.
  await supabase
    .from("company_group_members")
    .delete()
    .eq("company_id", companyId)
    .eq("user_id", trimmedUserId);

  const { error } = await supabase
    .from("company_users")
    .delete()
    .eq("company_id", companyId)
    .eq("user_id", trimmedUserId);

  if (error) {
    return { ok: false, error: "Neizdevās noņemt lietotāju no uzņēmuma." };
  }

  // Notify after membership is gone; profile email is still available.
  await sendCompanyAccessNotice(trimmedUserId, "removed");

  return { ok: true };
}
