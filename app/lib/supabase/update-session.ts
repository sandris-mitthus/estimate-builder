import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";
import {
  getSupabaseStorageKey,
  listForeignSupabaseCookieNames,
} from "@/app/lib/supabase/storage-key";

const cookieRemoveOptions = {
  path: "/",
  maxAge: 0,
  sameSite: "lax" as const,
};

function purgeForeignSupabaseCookies(
  request: NextRequest,
  response: NextResponse,
  storageKey: string,
) {
  for (const name of listForeignSupabaseCookieNames(
    request.cookies.getAll(),
    storageKey,
  )) {
    response.cookies.set(name, "", cookieRemoveOptions);
  }
}

const PUBLIC_PATHS = [
  "/auth/",
  "/auth/auth-code-error",
  "/docs",
  "/wiki",
  "/privacy",
  "/terms",
  "/cookies",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function getOAuthFallbackRedirect(request: NextRequest): NextResponse | null {
  if (
    request.nextUrl.pathname !== "/" ||
    !request.nextUrl.searchParams.has("code")
  ) {
    return null;
  }

  const callbackUrl = request.nextUrl.clone();
  callbackUrl.pathname = "/auth/callback";
  return NextResponse.redirect(callbackUrl);
}

export async function updateSession(request: NextRequest) {
  const oauthFallbackRedirect = getOAuthFallbackRedirect(request);
  if (oauthFallbackRedirect) {
    return oauthFallbackRedirect;
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  const storageKey = getSupabaseStorageKey(env.url);
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        purgeForeignSupabaseCookies(request, supabaseResponse, storageKey);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  purgeForeignSupabaseCookies(request, supabaseResponse, storageKey);

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname) && pathname !== "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
