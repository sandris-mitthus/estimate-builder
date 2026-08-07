import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type CompanyPaymentAccessRow = {
  payment_plan_id: string | null;
  payment_plan_until: string | null;
  payment_plan_paid: boolean | null;
  access_blocked: boolean | null;
  is_vip: boolean | null;
};

/** Request-scoped company payment/VIP/block snapshot (shared by lock + modules). */
export const getCompanyPaymentAccessRow = cache(
  async (companyId: string): Promise<CompanyPaymentAccessRow | null> => {
    if (!companyId.trim() || !isSupabaseAdminConfigured()) {
      return null;
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("companies")
      .select(
        "payment_plan_id, payment_plan_until, payment_plan_paid, access_blocked, is_vip",
      )
      .eq("id", companyId.trim())
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return data as CompanyPaymentAccessRow;
  },
);
