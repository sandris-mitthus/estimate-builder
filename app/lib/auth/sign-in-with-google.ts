import { createClient } from "@/app/lib/supabase/client";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";

function getOAuthSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export async function signInWithGoogle(returnPath?: string) {
  const supabase = createClient();
  const callbackUrl = new URL(`${getOAuthSiteUrl()}/auth/callback`);

  if (returnPath) {
    callbackUrl.searchParams.set("next", getSafeRedirectPath(returnPath));
  }

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });
}
