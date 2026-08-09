"use server";

import { revalidatePath } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { setCompanyFrontendModuleEnabled } from "@/app/lib/frontend-modules/company-repository";
import {
  updateCompanyPaymentPlan,
  updateCompanyVip,
  type CompanyPaymentPlanAssignment,
} from "@/app/lib/payment-plans/repository";

// These actions change another company's data, so the acting admin's own app
// shell does not need revalidating — only the companies list.
export async function setCompanyFrontendModuleEnabledAction(input: {
  companyId: string;
  moduleKey: string;
  isEnabled: boolean;
}) {
  await assertSystemAdminAccess();
  const result = await setCompanyFrontendModuleEnabled(
    input.companyId,
    input.moduleKey,
    input.isEnabled,
  );
  if (result.ok) {
    revalidatePath("/site_companies");
  }
  return result;
}

export async function updateCompanyPaymentPlanAction(
  companyId: string,
  input: CompanyPaymentPlanAssignment,
) {
  await assertSystemAdminAccess();
  const result = await updateCompanyPaymentPlan(companyId, input);
  if (result.ok) {
    revalidatePath("/site_companies");
    revalidatePath("/site_payment_plans");
    revalidatePath("/", "layout");
  }
  return result;
}

export async function updateCompanyVipAction(
  companyId: string,
  isVip: boolean,
) {
  await assertSystemAdminAccess();
  const result = await updateCompanyVip(companyId, isVip);
  if (result.ok) {
    revalidatePath("/site_companies");
  }
  return result;
}
