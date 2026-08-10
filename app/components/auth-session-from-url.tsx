"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { EmailOtpType, Session, SupabaseClient } from "@supabase/supabase-js";
import { useTranslations } from "@/app/components/translations-provider";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/** Prevents React Strict Mode double-mount from racing two confirm attempts. */
let confirmInFlight: Promise<"ok" | "fail" | "noop"> | null = null;

function parseHashParams(): URLSearchParams | null {
  const raw = window.location.hash.replace(/^#/, "").trim();
  if (!raw) {
    return null;
  }
  return new URLSearchParams(raw);
}

function urlHasRecoverableAuth(): boolean {
  const hash = window.location.hash;
  if (hash.includes("access_token=") || hash.includes("error=")) {
    return true;
  }
  return new URLSearchParams(window.location.search).has("token_hash");
}

function createConfirmClient(): SupabaseClient {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error("Supabase env is missing.");
  }

  // detectSessionInUrl off — we handle the hash ourselves to avoid a race that
  // clears tokens before setSession runs (common with invite links).
  return createBrowserClient(env.url, env.anonKey, {
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

async function establishSession(
  supabase: SupabaseClient,
): Promise<Session | null> {
  const hashParams = parseHashParams();
  const searchParams = new URLSearchParams(window.location.search);

  const authError = hashParams?.get("error") ?? searchParams.get("error");
  if (authError) {
    return null;
  }

  const accessToken = hashParams?.get("access_token");
  const refreshToken = hashParams?.get("refresh_token");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type") ?? hashParams?.get("type");

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      return null;
    }
    return data.session;
  }

  if (tokenHash && typeParam && OTP_TYPES.has(typeParam)) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam as EmailOtpType,
    });
    if (error || !data.session) {
      return null;
    }
    return data.session;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

async function runConfirmOnce(): Promise<"ok" | "fail" | "noop"> {
  if (confirmInFlight) {
    return confirmInFlight;
  }

  confirmInFlight = (async () => {
    try {
      if (!urlHasRecoverableAuth()) {
        const supabase = createConfirmClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return session ? "ok" : "noop";
      }

      const supabase = createConfirmClient();
      const session = await establishSession(supabase);
      return session ? "ok" : "fail";
    } catch {
      return "fail";
    } finally {
      // Allow a later recover attempt only after this one fully settles.
      queueMicrotask(() => {
        confirmInFlight = null;
      });
    }
  })();

  return confirmInFlight;
}

function redirectAfterAuth(next: string) {
  const redirectTo = getSafeRedirectPath(
    new URLSearchParams(window.location.search).get("next") ?? next,
  );
  // Full navigation so middleware/server definitely see the new auth cookies.
  window.location.replace(redirectTo);
}

/**
 * Completes invite / recovery / magic-link sessions delivered in the URL hash
 * (Supabase does not use PKCE for inviteUserByEmail). Also accepts token_hash
 * query links when email templates are configured that way.
 */
export function AuthSessionFromUrl({
  next = "/",
  mode = "confirm",
}: {
  next?: string;
  /** confirm = always attempt; recover = only if URL has tokens or existing session */
  mode?: "confirm" | "recover";
}) {
  const { t } = useTranslations();
  const [phase, setPhase] = useState<"idle" | "working" | "failed">(
    mode === "confirm" ? "working" : "idle",
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (mode === "recover" && !urlHasRecoverableAuth()) {
        // Maybe setSession already succeeded on /auth/confirm but finalize
        // bounced here — check for an existing cookie session.
        const result = await runConfirmOnce();
        if (cancelled) {
          return;
        }
        if (result === "ok") {
          redirectAfterAuth(next);
        }
        return;
      }

      if (!cancelled) {
        setPhase("working");
      }

      const result = await runConfirmOnce();
      if (cancelled) {
        return;
      }

      if (result === "ok") {
        redirectAfterAuth(next);
        return;
      }

      if (result === "noop" && mode === "recover") {
        setPhase("idle");
        return;
      }

      setPhase("failed");
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [mode, next]);

  if (phase === "idle") {
    return null;
  }

  if (phase === "failed") {
    if (mode === "recover") {
      return null;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f4f5] px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-[#18181b]">
            {t("auth.error_page.title", "Pierakstīšanās neizdevās")}
          </h1>
          <p className="mt-2 text-sm text-[#52525b]">
            {t(
              "auth.confirm.failed",
              "Uzaicinājuma saite nav derīga vai ir beigusies. Paprasī jaunu uzaicinājumu un atver to tajā pašā pārlūkā.",
            )}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-medium text-[#2563eb] hover:underline"
          >
            {t("auth.error_page.back_to_login", "Atpakaļ uz pierakstīšanos")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#f4f4f5] px-4">
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-[#18181b]">
          {t("auth.confirm.loading", "Pabeidz pierakstīšanos…")}
        </p>
      </div>
    </main>
  );
}

/** When invite/recovery tokens land on Site URL (`/#access_token=…`), send them to confirm. */
export function AuthHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token=")) {
      return;
    }
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const next =
      params.get("type") === "recovery" ? "?next=/reset-password" : "";
    window.location.replace(`/auth/confirm${next}${hash}`);
  }, []);

  return null;
}
