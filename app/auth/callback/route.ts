import { NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { createClient } from "@/app/lib/supabase/server";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function resolveRedirectOrigin(origin: string, forwardedHost: string | null): string {
  if (process.env.NODE_ENV === "development") {
    return origin;
  }

  if (forwardedHost) {
    if (ALLOWED_ORIGIN) {
      try {
        const allowed = new URL(ALLOWED_ORIGIN);
        if (forwardedHost === allowed.host) {
          return `https://${forwardedHost}`;
        }
      } catch {
        // fall through to origin
      }
      return origin;
    }
    return `https://${forwardedHost}`;
  }

  return origin;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN?.trim();

      if (allowedDomain) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email?.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const redirectOrigin = resolveRedirectOrigin(origin, forwardedHost);
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
