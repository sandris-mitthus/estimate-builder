import { NextResponse } from "next/server";
import { resolveAllowedEmailDomain } from "@/app/lib/integrations/google-auth";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { createClient } from "@/app/lib/supabase/server";
import { activateInvitedCompanyMemberships } from "@/app/lib/users/activate-invited-membership";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function resolveRedirectOrigin(
  origin: string,
  forwardedHost: string | null,
): string {
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
      const allowedDomain = await resolveAllowedEmailDomain();

      if (allowedDomain) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (
          !user?.email
            ?.toLowerCase()
            .endsWith(`@${allowedDomain.toLowerCase()}`)
        ) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await activateInvitedCompanyMemberships(user.id);
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const redirectOrigin = resolveRedirectOrigin(origin, forwardedHost);
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Invite / recovery links often deliver tokens in the URL hash (not ?code=).
  // The hash is invisible to this route handler but survives the redirect, so
  // /auth/confirm can call setSession on the client.
  const confirmUrl = new URL("/auth/confirm", origin);
  if (next && next !== "/") {
    confirmUrl.searchParams.set("next", next);
  }
  return NextResponse.redirect(confirmUrl);
}
