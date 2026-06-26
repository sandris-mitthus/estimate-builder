import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { downloadWorkerPhotoFile } from "@/app/lib/workers/photo-storage";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return new Response("Not configured", { status: 503 });
  }

  const workerId = new URL(request.url).searchParams.get("workerId")?.trim();
  if (!workerId) {
    return new Response("Bad request", { status: 400 });
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = createAdminClient();
  const { data: worker, error } = await supabase
    .from("company_workers")
    .select("id")
    .eq("id", workerId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !worker) {
    return new Response("Not found", { status: 404 });
  }

  const photo = await downloadWorkerPhotoFile(supabase, companyId, workerId);
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await photo.data.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
