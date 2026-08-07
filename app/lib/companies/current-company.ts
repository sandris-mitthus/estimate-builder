import { cache } from "react";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const BOOTSTRAP_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export type CompanyMembershipRow = {
  company_id: string;
  status?: string;
  role?: string;
};

/**
 * Memberships for the signed-in user with invited → active promotion applied.
 * Activation runs here, on rows we already read, so an invite link grants access
 * within the same request without a second `company_users` round trip.
 */
const listCurrentUserMemberships = cache(async function listCurrentUserMemberships(): Promise<
  CompanyMembershipRow[]
> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_users")
    .select("company_id, status, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<CompanyMembershipRow[]>();

  if (error || !data) {
    return [];
  }

  if (!data.some((membership) => membership.status === "invited")) {
    return data;
  }

  const { error: activateError } = await supabase
    .from("company_users")
    .update({ status: "active" })
    .eq("user_id", user.id)
    .eq("status", "invited");

  if (activateError) {
    return data;
  }

  return data.map((membership) =>
    membership.status === "invited"
      ? { ...membership, status: "active" }
      : membership,
  );
});

/**
 * Active membership row for the signed-in user, carrying `role` so callers do not
 * need a second `company_users` lookup. Only active membership grants access:
 * invited = pending email acceptance, disabled = blocked, and after
 * removeCompanyUser there is no row at all.
 */
export const getCurrentCompanyMembership = cache(
  async function getCurrentCompanyMembership(): Promise<CompanyMembershipRow | null> {
    const memberships = await listCurrentUserMemberships();
    return (
      memberships.find((membership) => membership.status === "active") ?? null
    );
  },
);

export const getCurrentCompanyId = cache(async function getCurrentCompanyId(): Promise<
  string | null
> {
  return (await getCurrentCompanyMembership())?.company_id ?? null;
});

/** True when the user has been invited but has not opened the invite email yet. */
export const hasPendingCompanyInvite = cache(async function hasPendingCompanyInvite(): Promise<boolean> {
  const memberships = await listCurrentUserMemberships();
  if (memberships.some((membership) => membership.status === "active")) {
    return false;
  }
  return memberships.some((membership) => membership.status === "invited");
});

export async function requireCurrentCompanyId(): Promise<string | null> {
  return getCurrentCompanyId();
}
