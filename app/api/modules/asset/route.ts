import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  BOOTSTRAP_COMPANY_ID,
  getCurrentCompanyId,
} from "@/app/lib/companies/current-company";
import { MODULE_ASSETS_BUCKET } from "@/app/lib/modules/file-storage";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

const MODULE_ASSET_PATH =
  /^(modules\/[0-9a-f-]{36}|projects\/[0-9a-f-]{36})\/(visualizations|project)\/[^/]+$/i;
const COMPANY_MODULE_ASSET_PATH =
  /^companies\/([0-9a-f-]{36})\/(modules\/[0-9a-f-]{36}|projects\/[0-9a-f-]{36})\/(visualizations|project)\/[^/]+$/i;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return new Response("Not configured", { status: 503 });
  }

  const path = new URL(request.url).searchParams.get("path")?.trim() ?? "";
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return new Response("Forbidden", { status: 403 });
  }

  const companyPathMatch = path.match(COMPANY_MODULE_ASSET_PATH);
  const isLegacyBootstrapPath =
    companyId === BOOTSTRAP_COMPANY_ID && MODULE_ASSET_PATH.test(path);

  if (
    (!companyPathMatch || companyPathMatch[1] !== companyId) &&
    !isLegacyBootstrapPath
  ) {
    return new Response("Bad request", { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(MODULE_ASSETS_BUCKET)
    .download(path);

  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await data.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": data.type || "application/pdf",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
