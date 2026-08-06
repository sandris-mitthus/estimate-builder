import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

/** Marks company_users rows from invite → active after the user first signs in. */
export async function activateInvitedCompanyMemberships(
  userId: string,
): Promise<void> {
  const trimmed = userId.trim();
  if (!trimmed || !isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = createAdminClient();
  await supabase
    .from("company_users")
    .update({ status: "active" })
    .eq("user_id", trimmed)
    .eq("status", "invited");
}
