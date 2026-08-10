"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/forgot-password/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { PublicLanguageSelector } from "@/app/components/public-language-selector";
import { SiteFooter } from "@/app/components/site-footer";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { isValidEmail } from "@/app/lib/validation/contact-fields";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/repository";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

export function ForgotPasswordScreen({
  systemName,
  logoUrl = "",
  languages = [],
  activeLanguageCode = "lv",
  showHomeLink = true,
}: {
  systemName: string;
  logoUrl?: string;
  languages?: SiteLanguageSummary[];
  activeLanguageCode?: string;
  showHomeLink?: boolean;
}) {
  const { t } = useTranslations();
  const { clearFeedback, showFeedback } = useFeedbackToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    clearFeedback();
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

    setLoading(true);
    const result = await requestPasswordResetAction({ email: trimmedEmail });
    setLoading(false);

    if (!result.ok) {
      showFeedback({ type: "error", text: translateActionError(t, result) });
      return;
    }

    setSentTo(trimmedEmail);
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
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
          aria-labelledby="forgot-password-title"
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
              id="forgot-password-title"
              className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950"
            >
              {t("auth.forgot.title", "Atjaunot paroli")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {t(
                "auth.forgot.subtitle",
                "Ievadi e-pastu — nosūtīsim saiti paroles atjaunošanai.",
              )}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_16px_45px_rgba(24,24,27,0.08)] sm:p-8">
            {sentTo ? (
              <div className="text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <i className="fas fa-envelope-open-text" aria-hidden="true" />
                </span>
                <p className="mt-4 text-lg font-semibold tracking-[-0.02em] text-zinc-950">
                  {t("auth.forgot.check_email.title", "Pārbaudi e-pastu")}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {t(
                    "auth.forgot.check_email.description",
                    "Ja konts ar adresi {email} eksistē, nosūtījām paroles atjaunošanas saiti.",
                    { email: sentTo },
                  )}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="text-left">
                <label className="block text-sm font-medium text-zinc-800">
                  {t("auth.email.email_label", "E-pasts")}
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    className={fieldClassName}
                    placeholder="vards@uznemums.lv"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-[15px] font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <i
                      className="fas fa-circle-notch fa-spin text-xs"
                      aria-hidden="true"
                    />
                  ) : null}
                  {t("auth.forgot.submit", "Nosūtīt saiti")}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link
              href="/login"
              className="font-semibold text-zinc-900 underline-offset-2 transition hover:underline"
            >
              {t("auth.forgot.back_to_login", "Atpakaļ uz pierakstīšanos")}
            </Link>
          </p>
        </section>
      </div>

      <SiteFooter systemName={systemName} bordered layout="centered" />
    </main>
  );
}
