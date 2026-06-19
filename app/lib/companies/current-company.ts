import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay, resolveAvatarUrl } from "@/app/lib/auth/map-user-display";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const BOOTSTRAP_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

type CompanyMembershipRow = {
  company_id: string;
  status?: string;
};

function mapAuthUserProfile(user: User) {
  const { name } = mapUserDisplay(user);

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    avatar_url: resolveAvatarUrl(user) ?? "",
  };
}

async function ensureUserProfile(user: User): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = createAdminClient();
  const profile = mapAuthUserProfile(user);
  const { error } = await supabase.from("users").insert({
    ...profile,
    is_admin: false,
  });

  if (error) {
    await supabase.from("users").update(profile).eq("id", user.id);
  }
}

async function ensureBootstrapCompanyMembership(user: User): Promise<string | null> {
  const supabase = createAdminClient();
  await ensureUserProfile(user);

  const { error } = await supabase.from("company_users").upsert(
    {
      company_id: BOOTSTRAP_COMPANY_ID,
      user_id: user.id,
      role: "member",
      status: "active",
    },
    { onConflict: "company_id,user_id" },
  );

  if (error) {
    return null;
  }

  const { data: viewerGroup } = await supabase
    .from("company_user_groups")
    .select("id")
    .eq("company_id", BOOTSTRAP_COMPANY_ID)
    .eq("slug", "viewer")
    .maybeSingle();

  if (viewerGroup?.id) {
    await supabase.from("company_group_members").upsert(
      {
        company_id: BOOTSTRAP_COMPANY_ID,
        user_id: user.id,
        group_id: viewerGroup.id as string,
      },
      { onConflict: "company_id,user_id" },
    );
  }

  return BOOTSTRAP_COMPANY_ID;
}

export const getCurrentCompanyId = cache(async function getCurrentCompanyId(): Promise<
  string | null
> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  await ensureUserProfile(user);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_users")
    .select("company_id, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<CompanyMembershipRow[]>();

  if (!error && data.length > 0) {
    const activeMembership = data.find(
      (membership) => membership.status !== "disabled",
    );
    return activeMembership?.company_id ?? null;
  }

  return null;
});

export async function requireCurrentCompanyId(): Promise<string | null> {
  return getCurrentCompanyId();
}
