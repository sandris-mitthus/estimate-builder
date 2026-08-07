"use server";

import { revalidatePath } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import {
  createPaymentPlan,
  deletePaymentPlan,
  setPaymentPlansEnabled,
  updatePaymentPlan,
  type PaymentPlanInput,
} from "@/app/lib/payment-plans/repository";

// Plan catalog is admin-only data: no need to invalidate the whole app shell.
function revalidatePaymentPlanPaths() {
  revalidatePath("/site_payment_plans");
  revalidatePath("/site_companies");
}

export async function setPaymentPlansEnabledAction(enabled: boolean) {
  await assertSystemAdminAccess();
  const result = await setPaymentPlansEnabled(enabled);
  if (result.ok) {
    revalidatePaymentPlanPaths();
  }
  return result;
}

export async function createPaymentPlanAction(input: PaymentPlanInput) {
  await assertSystemAdminAccess();
  const result = await createPaymentPlan(input);
  if (result.ok) {
    revalidatePaymentPlanPaths();
  }
  return result;
}

export async function updatePaymentPlanAction(
  planId: string,
  input: PaymentPlanInput,
) {
  await assertSystemAdminAccess();
  const result = await updatePaymentPlan(planId, input);
  if (result.ok) {
    revalidatePaymentPlanPaths();
  }
  return result;
}

export async function deletePaymentPlanAction(planId: string) {
  await assertSystemAdminAccess();
  const result = await deletePaymentPlan(planId);
  if (result.ok) {
    revalidatePaymentPlanPaths();
  }
  return result;
}
