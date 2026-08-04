"use server";

import { revalidatePath } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import {
  createFrontendModule,
  deleteFrontendModule,
  updateFrontendModuleEnabled,
  type FrontendModuleInput,
} from "@/app/lib/frontend-modules/repository";
import { NAV_FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";

const NAV_LINKED_MODULE_KEYS = new Set<string>(
  Object.values(NAV_FRONTEND_MODULE_KEYS),
);

function revalidateFrontendModulePaths(moduleKey: string) {
  revalidatePath("/site_frontend_modules");

  if (NAV_LINKED_MODULE_KEYS.has(moduleKey.trim().toLowerCase())) {
    revalidatePath("/", "layout");
    revalidatePath("/tasks");
    revalidatePath("/workers");
    revalidatePath("/tools");
    revalidatePath("/timeline");
    revalidatePath("/timeline-graph");
  }
}

export async function createFrontendModuleAction(input: FrontendModuleInput) {
  await assertSystemAdminAccess();

  const result = await createFrontendModule(input);

  if (result.ok) {
    revalidatePath("/site_frontend_modules");
  }

  return result;
}

export async function updateFrontendModuleEnabledAction(
  moduleKey: string,
  isEnabled: boolean,
) {
  await assertSystemAdminAccess();

  const result = await updateFrontendModuleEnabled(moduleKey, isEnabled);

  if (result.ok) {
    revalidateFrontendModulePaths(moduleKey.trim().toLowerCase());
  }

  return result;
}

export async function deleteFrontendModuleAction(moduleKey: string) {
  await assertSystemAdminAccess();

  const result = await deleteFrontendModule(moduleKey);

  if (result.ok) {
    revalidateFrontendModulePaths(moduleKey.trim().toLowerCase());
  }

  return result;
}
