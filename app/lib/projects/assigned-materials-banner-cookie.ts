import { readCookie, writeCookie } from "@/app/lib/client/cookies";

const COOKIE_PREFIX = "eb_assigned_materials_banner_collapsed";

function cookieName(userId: string): string {
  return `${COOKIE_PREFIX}_${userId.trim()}`;
}

export function readAssignedMaterialsBannerCollapsed(
  userId: string,
): boolean {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return false;
  }

  return readCookie(cookieName(trimmedUserId)) === "1";
}

export function writeAssignedMaterialsBannerCollapsed(
  userId: string,
  collapsed: boolean,
): void {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return;
  }

  writeCookie(cookieName(trimmedUserId), collapsed ? "1" : "0");
}
