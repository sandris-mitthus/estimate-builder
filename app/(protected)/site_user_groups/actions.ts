"use server";

import { revalidatePath } from "next/cache";
import type { PermissionSet } from "@/app/lib/auth/permissions";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import {
  createSiteUserGroup,
  deleteSiteUserGroup,
  updateSiteUserGroupPermissions,
} from "@/app/lib/site-admin/repository";

export async function createSiteUserGroupAction(name: string) {
  await assertSystemAdminAccess();

  const result = await createSiteUserGroup({ name });

  if (result.ok) {
    revalidatePath("/site_user_groups");
  }

  return result;
}

export async function deleteSiteUserGroupAction(groupId: string) {
  await assertSystemAdminAccess();

  const result = await deleteSiteUserGroup(groupId);

  if (result.ok) {
    revalidatePath("/site_user_groups");
  }

  return result;
}

export async function updateSiteUserGroupPermissionsAction(
  groupId: string,
  permissions: PermissionSet,
) {
  await assertSystemAdminAccess();

  const result = await updateSiteUserGroupPermissions(groupId, permissions);

  if (result.ok) {
    revalidatePath("/site_user_groups");
  }

  return result;
}
