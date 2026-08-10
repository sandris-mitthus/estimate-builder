/**
 * Builds auth email CTA links on the app domain (e.g. uupis.com) instead of
 * embedding Supabase's `*.supabase.co/auth/v1/verify` action_link.
 *
 * `/auth/confirm` completes the session via `verifyOtp({ token_hash, type })`.
 */

export type AuthEmailOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email";

export function getSiteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3100"
  );
}

export function authConfirmRedirectUrl(next?: string): string {
  const base = `${getSiteOrigin()}/auth/confirm`;
  if (!next) return base;
  const path = next.startsWith("/") ? next : `/${next}`;
  return `${base}?next=${encodeURIComponent(path)}`;
}

export function buildSiteAuthConfirmLink(options: {
  hashedToken: string;
  type: AuthEmailOtpType;
  next?: string;
}): string {
  const url = new URL(`${getSiteOrigin()}/auth/confirm`);
  url.searchParams.set("token_hash", options.hashedToken);
  url.searchParams.set("type", options.type);
  if (options.next) {
    const path = options.next.startsWith("/")
      ? options.next
      : `/${options.next}`;
    url.searchParams.set("next", path);
  }
  return url.toString();
}

type GenerateLinkProperties = {
  hashed_token?: string | null;
  action_link?: string | null;
};

/**
 * Prefer site-domain token_hash link; fall back to Supabase action_link.
 */
export function resolveAuthEmailLink(
  properties: GenerateLinkProperties | null | undefined,
  options: { type: AuthEmailOtpType; next?: string },
): string | null {
  const hashedToken = properties?.hashed_token?.trim() ?? "";
  if (hashedToken) {
    return buildSiteAuthConfirmLink({
      hashedToken,
      type: options.type,
      next: options.next,
    });
  }

  const actionLink = properties?.action_link?.trim() ?? "";
  return actionLink || null;
}
