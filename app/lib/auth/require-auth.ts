import { getCurrentUser } from "@/app/lib/auth/get-current-user";

const DENIED = { ok: false as const, error: "Nav autorizācijas." };

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return { user: null, denied: DENIED };
  return { user, denied: null };
}
