import { readCookie, writeCookie } from "@/app/lib/client/cookies";

export const ANNOUNCEMENT_SEEN_COOKIE_PREFIX = "eb_announcement_seen_";

export function announcementSeenCookieName(announcementId: string): string {
  return `${ANNOUNCEMENT_SEEN_COOKIE_PREFIX}${announcementId.trim()}`;
}

export function isAnnouncementSeenCookieName(name: string): boolean {
  return name.startsWith(ANNOUNCEMENT_SEEN_COOKIE_PREFIX);
}

export function announcementIdFromSeenCookieName(name: string): string | null {
  if (!isAnnouncementSeenCookieName(name)) {
    return null;
  }

  const id = name.slice(ANNOUNCEMENT_SEEN_COOKIE_PREFIX.length).trim();
  return id || null;
}

export function readAnnouncementSeen(announcementId: string): boolean {
  const trimmedId = announcementId.trim();
  if (!trimmedId) {
    return false;
  }

  return readCookie(announcementSeenCookieName(trimmedId)) === "1";
}

export function writeAnnouncementSeen(
  announcementId: string,
  expiresAt: string,
): void {
  const trimmedId = announcementId.trim();
  if (!trimmedId) {
    return;
  }

  writeCookie(
    announcementSeenCookieName(trimmedId),
    "1",
    cookieMaxAgeDaysUntil(expiresAt),
  );
}

function cookieMaxAgeDaysUntil(expiresAt: string): number {
  const trimmed = expiresAt.trim();
  const expiry = Date.parse(`${trimmed}T23:59:59`);
  if (!Number.isFinite(expiry)) {
    return 365;
  }

  const msLeft = expiry - Date.now();
  const daysLeft = Math.ceil(msLeft / 86_400_000);
  return Math.min(365, Math.max(1, daysLeft));
}
