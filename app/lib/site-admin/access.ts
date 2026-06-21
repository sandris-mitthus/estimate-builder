import { notFound } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";

export async function assertSystemAdminAccess(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      notFound();
    }

    return true;
  }

  const user = await getCurrentUser();
  if (!user || !(await isSystemAdminUser(user))) {
    notFound();
  }

  return true;
}
