import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";

export async function assertSystemAdminAccess(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      notFound();
    }

    // Local-only escape hatch — never open site admin without explicit opt-in.
    if (process.env.ALLOW_OPEN_SITE_ADMIN !== "1") {
      redirect("/");
    }

    return true;
  }

  const user = await getCurrentUser();
  if (!user || !(await isSystemAdminUser(user))) {
    redirect("/");
  }

  return true;
}
