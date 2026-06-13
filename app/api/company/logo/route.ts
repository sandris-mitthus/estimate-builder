import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { COMPANY_LOGO_BUCKET } from "@/app/lib/settings/logo-storage";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return new Response("Not configured", { status: 503 });
  }

  const supabase = createAdminClient();
  const { data: files } = await supabase.storage
    .from(COMPANY_LOGO_BUCKET)
    .list("company");

  if (!files?.length) {
    return new Response("Not found", { status: 404 });
  }

  const logoFile = files[0];
  const path = `company/${logoFile.name}`;

  const { data, error } = await supabase.storage
    .from(COMPANY_LOGO_BUCKET)
    .download(path);

  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await data.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": data.type || "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
