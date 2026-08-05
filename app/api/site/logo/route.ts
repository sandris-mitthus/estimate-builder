import { serveSiteBrandingAsset } from "@/app/lib/site-admin/serve-branding";

export async function GET() {
  return serveSiteBrandingAsset("logo");
}
