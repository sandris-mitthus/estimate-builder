"use server";

import { revalidatePath } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import {
  createPaymentPlan,
  deletePaymentPlan,
  saveTrialSettings,
  setPaymentPlansEnabled,
  updatePaymentPlan,
  type PaymentPlanInput,
  type TrialSettings,
} from "@/app/lib/payment-plans/repository";

// Plan catalog feeds the public landing pricing section when payment plans are on.
function revalidatePaymentPlanPaths() {
  revalidatePath("/site_payment_plans");
  revalidatePath("/site_companies");
  revalidatePath("/", "layout");
}

export async function setPaymentPlansEnabledAction(enabled: boolean) {
  await assertSystemAdminAccess();
  const result = await setPaymentPlansEnabled(enabled);
  if (result.ok) {
    revalidatePaymentPlanPaths();
  }
  return result;
}

export async function saveTrialSettingsAction(input: TrialSettings) {
  await assertSystemAdminAccess();
  const result = await saveTrialSettings(input);
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
