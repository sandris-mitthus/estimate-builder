import { cache } from "react";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const BOOTSTRAP_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

type CompanyMembershipRow = {
  company_id: string;
  status?: string;
};

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
