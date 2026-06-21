import { redirect } from "next/navigation";
import { LoginGate } from "@/app/components/login-gate";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [user, siteSettings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  if (user) {
    redirect("/");
  }

  return (
    <LoginGate
      systemName={siteSettings.systemName}
      slogan={siteSettings.slogan}
    />
  );
}
