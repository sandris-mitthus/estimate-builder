"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  registerWithEmailAction,
  resendSignupConfirmationAction,
} from "@/app/login/actions";
import { AuthHashRedirect } from "@/app/components/auth-session-from-url";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { SiteFooter } from "@/app/components/site-footer";
import { signInWithEmailPassword } from "@/app/lib/auth/sign-in-with-email";
import { signInWithGoogle } from "@/app/lib/auth/sign-in-with-google";
import { useTranslations } from "@/app/components/translations-provider";
import { writeCookie } from "@/app/lib/client/cookies";
import { ANONYMOUS_LANGUAGE_COOKIE } from "@/app/lib/i18n/language-cookie";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { isValidEmail } from "@/app/lib/validation/contact-fields";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/repository";

/** Publiskā dokumentācija vēl nav sakārtota — saite paslēpta, līdz saturs ir gatavs. */
const SHOW_DOCS_LINK = false;

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

const backgroundCards = [
  "left-[3%] top-[6%] rotate-[-14deg]",
  "left-[22%] top-[-8%] rotate-[10deg]",
  "right-[22%] top-[3%] rotate-[-8deg]",
  "right-[1%] top-[6%] rotate-[13deg]",
  "left-[8%] bottom-[5%] rotate-[11deg]",
  "left-[36%] bottom-[-9%] rotate-[-5deg]",
  "right-[9%] bottom-[1%] rotate-[-12deg]",
];

type EmailMode = "login" | "register";

export function LoginGate({
  returnPath = "/",
  systemName,
  slogan,
  logoUrl = "",
  languages = [],
  activeLanguageCode = "lv",
  emailAuthEnabled = false,
}: {
  returnPath?: string;
  systemName: string;
  slogan: string;
  logoUrl?: string;
  languages?: SiteLanguageSummary[];
  activeLanguageCode?: string;
  /** Custom email/password auth — only when Resend is enabled. */
  emailAuthEnabled?: boolean;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { clearFeedback, showFeedback } = useFeedbackToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const busy = googleLoading || emailLoading;

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
        text: t(
          "auth.email.password_min",
          "Parolei jābūt vismaz 8 rakstzīmēm.",
        ),
      });
      return;
    }

    if (emailMode === "register") {
      if (password !== confirmPassword) {
        showFeedback({
          type: "error",
          text: t(
            "auth.email.password_mismatch",
            "Paroles nesakrīt.",
          ),
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

      showFeedback({
        type: "success",
        text: t(
          "auth.email.register_sent",
          "Apstiprinājuma e-pasts nosūtīts. Atver saiti, lai aktivizētu kontu.",
        ),
      });
      setEmailMode("login");
      setConfirmPassword("");
      return;
    }

    setEmailLoading(true);
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
      email: email.trim().toLowerCase(),
      password,
    });
    setEmailLoading(false);

    if (!result.ok) {
      showFeedback({ type: "error", text: translateActionError(t, result) });
      return;
    }

    showFeedback({
      type: "success",
      text: t(
        "auth.email.resend_sent",
        "Apstiprinājuma e-pasts nosūtīts vēlreiz.",
      ),
    });
  }

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f4f4f5] px-4 py-10">
      <AuthHashRedirect />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f4f4f5_45%,#e4e4e7_100%)]" />
      <div className="absolute inset-0 -z-10 blur-[5px]" aria-hidden="true">
        {backgroundCards.map((className, index) => (
          <DecorativePlanCard key={className} className={className} index={index} />
        ))}
      </div>
      <div className="absolute inset-0 -z-10 bg-white/45 backdrop-blur-[2px]" />

      <section
        className="relative w-full max-w-[440px] rounded-[1.65rem] border border-white/80 bg-white/93 px-8 py-10 text-center shadow-[0_28px_70px_rgba(24,24,27,0.22)] backdrop-blur-md sm:px-11"
        aria-labelledby="login-title"
      >
        <LoginLanguageSelector
          languages={languages}
          activeLanguageCode={activeLanguageCode}
        />
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="mx-auto mb-5 h-14 w-auto max-w-[180px] object-contain"
          />
        ) : null}
        <p
          id="login-title"
          className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[#18181b]"
        >
          {systemName}
        </p>
        <p className="mt-3 text-[15px] font-medium text-[#c4c4c7]">
          {slogan}
        </p>

        {emailAuthEnabled ? (
          <form onSubmit={handleEmailSubmit} className="mt-8 text-left">
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEmailMode("login");
                  setShowResendConfirm(false);
                  clearFeedback();
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  emailMode === "login"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {t("auth.email.tab_login", "Pierakstīties")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEmailMode("register");
                  setShowResendConfirm(false);
                  clearFeedback();
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  emailMode === "register"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {t("auth.email.tab_register", "Reģistrēties")}
              </button>
            </div>

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

            <label className="mt-3 block text-sm font-medium text-zinc-800">
              {t("auth.email.password_label", "Parole")}
              <input
                type="password"
                autoComplete={
                  emailMode === "register" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
                className={fieldClassName}
                placeholder="••••••••"
              />
            </label>

            {emailMode === "register" ? (
              <label className="mt-3 block text-sm font-medium text-zinc-800">
                {t("auth.email.confirm_password_label", "Atkārto paroli")}
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={busy}
                  className={fieldClassName}
                  placeholder="••••••••"
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-5 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-[15px] font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {emailLoading ? (
                <i
                  className="fas fa-circle-notch fa-spin text-xs"
                  aria-hidden="true"
                />
              ) : null}
              {emailMode === "register"
                ? t("auth.email.register_submit", "Izveidot kontu")
                : t("auth.email.login_submit", "Pierakstīties")}
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
        ) : null}

        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={busy}
          className={`${
            emailAuthEnabled ? "mt-0" : "mt-9"
          } inline-flex h-[58px] w-full items-center justify-center gap-4 rounded-xl border border-[#d8d8dd] bg-white px-6 text-[17px] font-medium tracking-[-0.02em] text-[#3f3f46] shadow-[0_1px_0_rgba(24,24,27,0.04)] transition hover:border-[#c7c7cf] hover:bg-[#fafafa] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <GoogleIcon />
          {googleLoading
            ? t("auth.signing_in", "Signing in...")
            : t("auth.google_sign_in", "Continue with Google")}
        </button>
        {SHOW_DOCS_LINK ? (
          <Link
            href="/docs"
            className="mt-5 inline-flex items-center justify-center text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
          >
            {t("auth.login.view_system_docs", "Dokumentācija")}
          </Link>
        ) : null}
      </section>

      <SiteFooter
        systemName={systemName}
        bordered={false}
        layout="centered"
        className="relative mt-9 w-full"
      />
    </main>
  );
}

function LoginLanguageSelector({
  languages,
  activeLanguageCode,
}: {
  languages: SiteLanguageSummary[];
  activeLanguageCode: string;
}) {
  const router = useRouter();
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [pendingLanguageCode, setPendingLanguageCode] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const activeLanguages = languages.filter((language) => language.isActive);
  const activeLanguage =
    activeLanguages.find((language) => language.code === activeLanguageCode) ??
    activeLanguages[0] ??
    null;
  const isChangingLanguage = pendingLanguageCode !== null || isRefreshing;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (pendingLanguageCode && activeLanguageCode === pendingLanguageCode) {
      setPendingLanguageCode(null);
    }
  }, [activeLanguageCode, pendingLanguageCode]);

  function handleLanguageSelect(code: string) {
    setOpen(false);

    if (code === activeLanguageCode || isChangingLanguage) {
      return;
    }

    setPendingLanguageCode(code);
    writeCookie(ANONYMOUS_LANGUAGE_COOKIE, code);
    startTransition(() => {
      router.refresh();
    });
  }

  if (!activeLanguage || activeLanguages.length <= 1) {
    return null;
  }

  return (
    <div ref={selectorRef} className="absolute right-5 top-5 text-left">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={isChangingLanguage}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {activeLanguage.code}
      </button>

      {open ? (
        <div className="absolute right-0 top-8 z-[70] w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {t("language.selector.label", "Language")}
          </div>
          <div
            role="listbox"
            aria-label={t("language.selector.aria", "Choose language")}
          >
            {activeLanguages.map((language) => {
              const isActive = language.code === activeLanguageCode;

              return (
                <button
                  key={language.code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-zinc-100 font-medium text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span>{language.name}</span>
                  <span className="font-mono text-xs uppercase text-zinc-400">
                    {language.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatAuthError(
  message: string,
  t: ReturnType<typeof useTranslations>["t"],
) {
  if (message.includes("provider is not enabled") || message.includes("Unsupported provider")) {
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
    return t(
      "auth.email.invalid_credentials",
      "Nepareizs e-pasts vai parole.",
    );
  }
  return formatAuthError(message, t);
}

function DecorativePlanCard({
  className,
  index,
}: {
  className: string;
  index: number;
}) {
  return (
    <div
      className={`absolute h-[340px] w-[250px] rounded-[1.3rem] border border-black/10 bg-white/88 p-5 shadow-[0_18px_45px_rgba(24,24,27,0.22)] ${className}`}
    >
      <div className="h-4 w-24 rounded-full bg-zinc-300/85" />
      <div className="mt-6 grid grid-cols-[1fr_auto] gap-x-7 gap-y-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        <span className="h-2 rounded bg-zinc-300/80" />
        <span className="h-2 w-12 rounded bg-zinc-300/80" />
        <span className="h-2 rounded bg-zinc-200" />
        <span className="h-2 w-10 rounded bg-zinc-200" />
        <span className="h-2 rounded bg-zinc-200" />
        <span className="h-2 w-14 rounded bg-zinc-200" />
      </div>
      <div className="mt-9 h-px bg-zinc-200" />
      <div className="mt-8 grid gap-3">
        <div className="h-3 w-28 rounded-full bg-zinc-300/80" />
        <div className="h-3 w-40 rounded-full bg-zinc-200" />
        <div className="h-3 w-32 rounded-full bg-zinc-200" />
      </div>
      <div
        className={`mt-9 h-5 w-16 rounded-full ${
          index % 3 === 0
            ? "bg-emerald-200/80"
            : index % 3 === 1
              ? "bg-sky-200/80"
              : "bg-amber-200/80"
        }`}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
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
