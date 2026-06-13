import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  getUserAccess,
  type UserAccess,
} from "@/app/lib/users/groups-repository";

const DENIED = { ok: false as const, error: "Nav autorizācijas." };

export type { UserAccess };

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, access: null, denied: DENIED };
  }

  const access = await getUserAccess(user.id);
  return { user, access, denied: null };
}
