import { normalizePersonName } from "@/app/lib/auth/normalize-person-name";
import type { UserSummary } from "@/app/lib/users/types";

export function resolveRelatedUserIds(
  currentUserId: string,
  currentUserName: string,
  users: UserSummary[],
): string[] {
  const normalizedCurrentName = normalizePersonName(currentUserName);
  if (!normalizedCurrentName) {
    return [currentUserId];
  }

  const relatedIds = users
    .filter((user) => normalizePersonName(user.name) === normalizedCurrentName)
    .map((user) => user.id);

  if (relatedIds.length === 0) {
    return [currentUserId];
  }

  return Array.from(new Set(relatedIds));
}
