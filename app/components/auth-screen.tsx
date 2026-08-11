"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  assertLoginRateLimitAction,
  registerWithEmailAction,
  resendSignupConfirmationAction,
} from "@/app/login/actions";
import { AuthHashRedirect } from "@/app/components/auth-session-from-url";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { PublicLanguageSelector } from "@/app/components/public-language-selector";
import { SiteFooter } from "@/app/components/site-footer";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { signInWithEmailPassword } from "@/app/lib/auth/sign-in-with-email";
import { signInWithGoogle } from "@/app/lib/auth/sign-in-with-google";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { isValidEmail } from "@/app/lib/validation/contact-fields";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/repository";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

const passwordFieldClassName =
  "w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-3 pr-11 text-left text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

export type AuthScreenMode = "login" | "signup";

export function AuthScreen({
  mode,
  returnPath = "/",
  systemName,
  logoUrl = "",
  languages = [],
  activeLanguageCode = "lv",
  emailAuthEnabled = false,
  googleAuthEnabled = true,
  showHomeLink = true,
}: {
  mode: AuthScreenMode;
  returnPath?: string;
  systemName: string;
  logoUrl?: string;
  languages?: SiteLanguageSummary[];
  activeLanguageCode?: string;
  /** Custom email/password auth — only when Resend is enabled. */
  emailAuthEnabled?: boolean;
  /** Google OAuth button — from /site_integrations. */
  googleAuthEnabled?: boolean;
  /** Off when the landing page integration is disabled: "/" would come back here. */
  showHomeLink?: boolean;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { clearFeedback, showFeedback } = useFeedbackToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const isSignup = mode === "signup";
  const busy = googleLoading || emailLoading;

  const showPasswordLabel = t("auth.email.show_password", "Rādīt paroli");
  const hidePasswordLabel = t("auth.email.hide_password", "Paslēpt paroli");

  const title = isSignup
    ? t("auth.email.register_submit", "Izveidot kontu")
    : t("auth.email.login_submit", "Pierakstīties");

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    clearFeedback();
    setShowResendConfirm(false);

    const { error: signInError } = await signInWithGoogle(returnPath);

    if (signInError) {
      showFeedback({
        type: "error",
        text: formatAuthError(signInError.message, t),
      });
      setGoogleLoading(false);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    clearFeedback();
    setShowResendConfirm(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      showFeedback({
        type: "error",
        text: t("validation.email_required", "Ievadi e-pasta adresi."),
      });
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      showFeedback({
        type: "error",
        text: t("validation.email_invalid", "Ievadi derīgu e-pasta adresi."),
      });
      return;
    }
    if (!password) {
      showFeedback({
        type: "error",
        text: t("auth.email.password_required", "Ievadi paroli."),
      });
      return;
    }
    if (password.length < 8) {
      showFeedback({
        type: "error",
        text: t("auth.email.password_min", "Parolei jābūt vismaz 8 rakstzīmēm."),
      });
      return;
    }

    if (isSignup) {
      if (password !== confirmPassword) {
        showFeedback({
          type: "error",
          text: t("auth.email.password_mismatch", "Paroles nesakrīt."),
        });
        return;
      }

      setEmailLoading(true);
      const result = await registerWithEmailAction({
        email: trimmedEmail,
        password,
      });
      setEmailLoading(false);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setRegisteredEmail(trimmedEmail);
      setConfirmPassword("");
      return;
    }

    setEmailLoading(true);
    const rate = await assertLoginRateLimitAction({ email: trimmedEmail });
    if (!rate.ok) {
      setEmailLoading(false);
      showFeedback({ type: "error", text: translateActionError(t, rate) });
      return;
    }

    const { error } = await signInWithEmailPassword(trimmedEmail, password);
    setEmailLoading(false);

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("email not confirmed") ||
        message.includes("not confirmed")
      ) {
        setShowResendConfirm(true);
        showFeedback({
          type: "error",
          text: t(
            "auth.email.not_confirmed",
            "E-pasts vēl nav apstiprināts. Pārbaudi iesūtni vai nosūti apstiprinājumu vēlreiz.",
          ),
        });
        return;
      }
      showFeedback({
        type: "error",
        text: formatEmailLoginError(error.message, t),
      });
      return;
    }

    router.replace(returnPath || "/");
    router.refresh();
  }

  async function handleResendConfirmation() {
    if (busy) return;
    clearFeedback();
    setEmailLoading(true);
    const result = await resendSignupConfirmationAction({
      email: (registeredEmail ?? email).trim().toLowerCase(),
      password,
    });
    setEmailLoading(false);

    if (!result.ok) {
      showFeedback({ type: "error", text: translateActionError(t, result) });
      return;
    }

    showFeedback({
      type: "success",
      text: t("auth.email.resend_sent", "Apstiprinājuma e-pasts nosūtīts vēlreiz."),
    });
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <AuthHashRedirect />

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6 lg:px-8">
        {showHomeLink ? (
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
          >
            <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
            {t("auth.back_home", "Atpakaļ uz sākumu")}
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        <PublicLanguageSelector
          languages={languages}
          activeLanguageCode={activeLanguageCode}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-10 lg:px-8">
        <section
          className="w-full max-w-[420px]"
          aria-labelledby="auth-screen-title"
        >
          <div className="text-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="mx-auto mb-5 h-12 w-auto max-w-[160px] object-contain"
              />
            ) : null}
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              {systemName}
            </p>
            <h1
              id="auth-screen-title"
              className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950"
            >
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {isSignup
                ? t(
                    "auth.signup.subtitle",
                    "Izveido kontu un sāc pirmo tāmi dažās minūtēs.",
                  )
                : t(
                    "auth.login.subtitle",
                    "Turpini darbu ar saviem projektiem un tāmēm.",
                  )}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_16px_45px_rgba(24,24,27,0.08)] sm:p-8">
            {registeredEmail ? (
              <div className="text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <i className="fas fa-envelope-open-text" aria-hidden="true" />
                </span>
                <p className="mt-4 text-lg font-semibold tracking-[-0.02em] text-zinc-950">
                  {t("auth.signup.check_email.title", "Pārbaudi e-pastu")}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {t(
                    "auth.signup.check_email.description",
                    "Nosūtījām apstiprinājuma saiti uz {email}. Atver to, lai aktivizētu kontu.",
                    { email: registeredEmail },
                  )}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleResendConfirmation()}
                  className="mt-5 w-full text-center text-sm font-medium text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t(
                    "auth.email.resend_confirmation",
                    "Nosūtīt apstiprinājuma e-pastu vēlreiz",
                  )}
                </button>
              </div>
            ) : (
              <>
                {emailAuthEnabled ? (
                  <form onSubmit={handleEmailSubmit} className="text-left">
                    <label className="block text-sm font-medium text-zinc-800">
                      {t("auth.email.email_label", "E-pasts")}
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={busy}
                        className={fieldClassName}
                        placeholder="vards@uznemums.lv"
                      />
                    </label>

                    <label className="mt-4 block text-sm font-medium text-zinc-800">
                      {t("auth.email.password_label", "Parole")}
                      <span className="relative mt-2 block">
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete={
                            isSignup ? "new-password" : "current-password"
                          }
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          disabled={busy}
                          className={passwordFieldClassName}
                          placeholder="••••••••"
                        />
                        <Tooltip
                          label={
                            showPassword ? hidePasswordLabel : showPasswordLabel
                          }
                          align="end"
                          className="absolute top-1/2 right-1.5 -translate-y-1/2"
                        >
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                            aria-label={
                              showPassword
                                ? hidePasswordLabel
                                : showPasswordLabel
                            }
                            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <i
                              className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                              aria-hidden="true"
                            />
                          </button>
                        </Tooltip>
                      </span>
                    </label>

                    {!isSignup ? (
                      <div className="mt-2 text-right">
                        <Link
                          href="/forgot-password"
                          className="text-sm font-medium text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline"
                        >
                          {t("auth.email.forgot_password", "Aizmirsi paroli?")}
                        </Link>
                      </div>
                    ) : null}

                    {isSignup ? (
                      <label className="mt-4 block text-sm font-medium text-zinc-800">
                        {t(
                          "auth.email.confirm_password_label",
                          "Atkārto paroli",
                        )}
                        <span className="relative mt-2 block">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) =>
                              setConfirmPassword(event.target.value)
                            }
                            disabled={busy}
                            className={passwordFieldClassName}
                            placeholder="••••••••"
                          />
                          <Tooltip
                            label={
                              showConfirmPassword
                                ? hidePasswordLabel
                                : showPasswordLabel
                            }
                            align="end"
                            className="absolute top-1/2 right-1.5 -translate-y-1/2"
                          >
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setShowConfirmPassword((current) => !current)
                              }
                              aria-label={
                                showConfirmPassword
                                  ? hidePasswordLabel
                                  : showPasswordLabel
                              }
                              className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <i
                                className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                                aria-hidden="true"
                              />
                            </button>
                          </Tooltip>
                        </span>
                      </label>
                    ) : null}

                    <button
                      type="submit"
                      disabled={busy}
                      className="mt-6 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-[15px] font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {emailLoading ? (
                        <i
                          className="fas fa-circle-notch fa-spin text-xs"
                          aria-hidden="true"
                        />
                      ) : null}
                      {title}
                    </button>

                    {showResendConfirm ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleResendConfirmation()}
                        className="mt-3 w-full text-center text-sm font-medium text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t(
                          "auth.email.resend_confirmation",
                          "Nosūtīt apstiprinājuma e-pastu vēlreiz",
                        )}
                      </button>
                    ) : null}

                    <div className="my-6 flex items-center gap-3">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        {t("auth.email.or", "vai")}
                      </span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                  </form>
                ) : isSignup ? (
                  <p className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600">
                    {t(
                      "auth.signup.google_only",
                      "E-pasta reģistrācija pašlaik nav pieejama. Izveido kontu ar Google.",
                    )}
                  </p>
                ) : null}

                {googleAuthEnabled ? (
                  <button
                    type="button"
                    onClick={() => void handleGoogleSignIn()}
                    disabled={busy}
                    className="inline-flex h-[54px] w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-6 text-[15px] font-medium tracking-[-0.01em] text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <GoogleIcon />
                    {googleLoading
                      ? t("auth.signing_in", "Signing in...")
                      : t("auth.google_sign_in", "Continue with Google")}
                  </button>
                ) : !emailAuthEnabled ? (
                  <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600">
                    {t(
                      "auth.google_disabled",
                      "Google pierakstīšanās pašlaik nav pieejama.",
                    )}
                  </p>
                ) : null}
              </>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            {isSignup
              ? t("auth.signup.have_account", "Jau ir konts?")
              : t("auth.login.no_account", "Nav konta?")}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-zinc-900 underline-offset-2 transition hover:underline"
            >
              {isSignup
                ? t("auth.email.login_submit", "Pierakstīties")
                : t("auth.email.register_submit", "Izveidot kontu")}
            </Link>
          </p>
        </section>
      </div>

      <SiteFooter systemName={systemName} bordered layout="centered" />
    </main>
  );
}

function formatAuthError(
  message: string,
  t: ReturnType<typeof useTranslations>["t"],
) {
  if (
    message.includes("provider is not enabled") ||
    message.includes("Unsupported provider")
  ) {
    return t(
      "auth.errors.google_not_enabled",
      "Google nav ieslēgts Supabase projektā. Authentication → Providers → Google → Enable.",
    );
  }
  return message;
}

function formatEmailLoginError(
  message: string,
  t: ReturnType<typeof useTranslations>["t"],
) {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return t("auth.email.invalid_credentials", "Nepareizs e-pasts vai parole.");
  }
  return formatAuthError(message, t);
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
