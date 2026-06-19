import { notFound } from "next/navigation";
import {
  createFullPermissions,
  type NavPermissionKey,
  NAV_PERMISSION_HREFS,
  NAV_PERMISSION_LABELS,
} from "@/app/lib/auth/permissions";
import { getCurrentUserAccess } from "@/app/lib/auth/require-permission";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import {
  canAccessNav,
  canPerformAction,
  type UserAccess,
} from "@/app/lib/users/groups-repository";

type CurrentUserAccess = {
  user:
    | NonNullable<Awaited<ReturnType<typeof getCurrentUserAccess>>>["user"]
    | null;
  access: UserAccess;
};

function getDevAccessSession(): CurrentUserAccess | null {
  if (isSupabaseConfigured() || process.env.NODE_ENV === "production") {
    return null;
  }

  const permissions = createFullPermissions(true);

  return {
    user: null,
    access: {
      userId: "local-dev",
      group: {
        id: "local-dev-admin",
        slug: "admin",
        name: "Lokālais dev režīms",
        isSystem: true,
        permissions,
      },
      permissions,
    },
  };
}

export async function assertNavAccess(
  navKey: NavPermissionKey,
): Promise<CurrentUserAccess | null> {
  const session = (await getCurrentUserAccess()) ?? getDevAccessSession();
  if (!session) {
    return null;
  }

  if (!canAccessNav(session.access, navKey)) {
    notFound();
  }

  return session;
}

export async function assertUserGroupsPageAccess(): Promise<
  CurrentUserAccess | null
> {
  const session = (await getCurrentUserAccess()) ?? getDevAccessSession();
  if (!session) {
    return null;
  }

  if (
    !canAccessNav(session.access, "user_groups") &&
    !canPerformAction(session.access, "groups.manage")
  ) {
    notFound();
  }

  return session;
}

const NAV_PERMISSION_KEYS_FOR_MENU: Exclude<NavPermissionKey, "user_groups">[] = [
  "projects",
  "modules",
  "estimate",
  "positions",
  "excluded_positions",
  "users",
  "settings",
];

export const NAV_ITEMS = NAV_PERMISSION_KEYS_FOR_MENU.map((key) => ({
  key,
  href: NAV_PERMISSION_HREFS[key],
  label: NAV_PERMISSION_LABELS[key],
}));

export function pathnameToNavKey(pathname: string): NavPermissionKey | null {
  if (pathname === "/users/groups") {
    return "user_groups";
  }

  if (pathname === "/users" || pathname.startsWith("/users/")) {
    return "users";
  }

  if (pathname === "/settings") {
    return "settings";
  }

  if (pathname === "/modules" || pathname.startsWith("/modules/")) {
    return "modules";
  }

  if (pathname === "/estimate") {
    return "estimate";
  }

  if (pathname === "/positions") {
    return "positions";
  }

  if (pathname === "/excluded-positions") {
    return "excluded_positions";
  }

  if (pathname === "/" || /^\/[^/]+$/.test(pathname)) {
    return "projects";
  }

  return null;
}

export function navKeyForHref(href: string): NavPermissionKey | null {
  const entry = Object.entries(NAV_PERMISSION_HREFS).find(
    ([, value]) => value === href,
  );
  return entry ? (entry[0] as NavPermissionKey) : null;
}
