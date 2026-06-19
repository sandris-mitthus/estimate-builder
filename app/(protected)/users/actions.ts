"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { requireAction } from "@/app/lib/auth/require-permission";
import type { PermissionSet } from "@/app/lib/auth/permissions";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";
import {
  assignUserToGroup,
  updateUserGroupPermissions,
} from "@/app/lib/users/groups-repository";
import {
  inviteUser,
  removeCompanyUser,
  updateCompanyUserStatus,
} from "@/app/lib/users/repository";

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

export async function setCompanyUserAccessAction(
  userId: string,
  status: "active" | "disabled",
) {
  const { denied, user } = await requireAction("users.manage_company_access");
  if (denied) return denied;

  if (user?.id === userId && status === "disabled") {
    return { ok: false as const, error: "Nevar liegt pieeju pašam sev." };
  }

  const result = await updateCompanyUserStatus(userId, status);

  if (result.ok) {
    revalidatePath("/users");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function removeCompanyUserAction(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { ok: false as const, error: "Nav autorizācijas." };
  }

  const isSelf = currentUser.id === userId;
  if (!isSelf) {
    const { denied } = await requireAction("users.manage_company_access");
    if (denied) return denied;
  }

  const result = await removeCompanyUser(userId);

  if (result.ok) {
    revalidatePath("/users");
    revalidatePath("/", "layout");
  }

  return result;
}
