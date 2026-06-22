import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { downloadCompanyLogoFile } from "@/app/lib/settings/logo-storage";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return new Response("Not configured", { status: 503 });
  }

  const companyId = new URL(request.url).searchParams.get("companyId")?.trim() || null;
  if (companyId && !(await isSystemAdminUser(user))) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = createAdminClient();
  const logo = await downloadCompanyLogoFile(supabase, companyId ?? undefined);

  if (!logo) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await logo.data.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": logo.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
