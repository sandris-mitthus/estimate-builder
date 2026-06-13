import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  type ActionPermissionKey,
  type NavPermissionKey,
} from "@/app/lib/auth/permissions";
import { requireAuth } from "@/app/lib/auth/require-auth";
import {
  canAccessNav,
  canPerformAction,
  getUserAccess,
  type UserAccess,
} from "@/app/lib/users/groups-repository";

const FORBIDDEN = { ok: false as const, error: "Nav tiesību." };

export async function requireAction(permission: ActionPermissionKey) {
  const result = await requireAuth();
  if (result.denied) {
    return result;
  }

  if (!canPerformAction(result.access, permission)) {
    return {
      user: result.user,
      access: result.access,
      denied: FORBIDDEN,
    };
  }

  return result;
}

export async function getCurrentUserAccess(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  access: UserAccess;
} | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const access = await getUserAccess(user.id);
  if (!access) {
    return null;
  }

  return { user, access };
}

export function resolveAllowedNavHrefs(access: UserAccess | null): string[] {
  const hrefs: string[] = [];
  const navKeys: NavPermissionKey[] = [
    "projects",
    "modules",
    "estimate",
    "positions",
    "excluded_positions",
    "users",
    "settings",
  ];

  const hrefByKey: Record<NavPermissionKey, string> = {
    projects: "/",
    modules: "/modules",
    estimate: "/estimate",
    positions: "/positions",
    excluded_positions: "/excluded-positions",
    users: "/users",
    user_groups: "/users/groups",
    settings: "/settings",
  };

  for (const key of navKeys) {
    if (canAccessNav(access, key)) {
      hrefs.push(hrefByKey[key]);
    }
  }

  return hrefs;
}
