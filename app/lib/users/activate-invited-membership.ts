import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

/** Marks company_users rows from invite → active after the user first signs in. */
export const activateInvitedCompanyMemberships = cache(
  async (userId: string): Promise<void> => {
    const trimmed = userId.trim();
    if (!trimmed || !isSupabaseAdminConfigured()) {
      return;
    }

    const supabase = createAdminClient();
    // Cheap existence check — skip UPDATE on the common (already active) path.
    const { data: pending } = await supabase
      .from("company_users")
      .select("id")
      .eq("user_id", trimmed)
      .eq("status", "invited")
      .limit(1);

    if (!pending?.length) {
      return;
    }

    await supabase
      .from("company_users")
      .update({ status: "active" })
      .eq("user_id", trimmed)
      .eq("status", "invited");
  },
);
