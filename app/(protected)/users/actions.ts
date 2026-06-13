"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import type { PermissionSet } from "@/app/lib/auth/permissions";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";
import {
  assignUserToGroup,
  updateUserGroupPermissions,
} from "@/app/lib/users/groups-repository";
import { inviteUser } from "@/app/lib/users/repository";

export async function inviteUserAction(email: string) {
  const { denied } = await requireAction("users.invite");
  if (denied) return denied;

  const emailError = validateRequiredEmail(email);
  if (emailError) {
    return { ok: false as const, error: emailError };
  }

  const result = await inviteUser(email);

  if (result.ok) {
    revalidatePath("/users");
  }

  return result;
}

export async function assignUserGroupAction(userId: string, groupId: string) {
  const { denied } = await requireAction("users.assign_group");
  if (denied) return denied;

  const result = await assignUserToGroup(userId, groupId);

  if (result.ok) {
    revalidatePath("/users");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function updateUserGroupPermissionsAction(
  groupId: string,
  permissions: PermissionSet,
) {
  const { denied } = await requireAction("groups.manage");
  if (denied) return denied;

  const result = await updateUserGroupPermissions(groupId, permissions);

  if (result.ok) {
    revalidatePath("/users/groups");
    revalidatePath("/", "layout");
  }

  return result;
}
