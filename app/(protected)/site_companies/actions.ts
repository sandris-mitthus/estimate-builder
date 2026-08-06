"use server";

import { revalidatePath } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { setCompanyFrontendModuleEnabled } from "@/app/lib/frontend-modules/company-repository";

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
    revalidatePath("/", "layout");
  }
  return result;
}
