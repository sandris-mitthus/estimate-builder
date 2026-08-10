"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { PublicLanguageSelector } from "@/app/components/public-language-selector";
import { SiteFooter } from "@/app/components/site-footer";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { createClient } from "@/app/lib/supabase/client";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/repository";

const MIN_PASSWORD_LENGTH = 8;

const fieldClassName =
  "w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-3 pr-11 text-left text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

export function ResetPasswordScreen({
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
  const router = useRouter();
  const { clearFeedback, showFeedback } = useFeedbackToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const showPasswordLabel = t("auth.email.show_password", "Rādīt paroli");
  const hidePasswordLabel = t("auth.email.hide_password", "Paslēpt paroli");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    clearFeedback();

    if (!password) {
      showFeedback({
        type: "error",
        text: t("auth.email.password_required", "Ievadi paroli."),
      });
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      showFeedback({
        type: "error",
        text: t(
          "auth.email.password_min",
          "Parolei jābūt vismaz 8 rakstzīmēm.",
        ),
      });
      return;
    }
    if (password !== confirmPassword) {
      showFeedback({
        type: "error",
        text: t("auth.email.password_mismatch", "Paroles nesakrīt."),
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      showFeedback({
        type: "error",
        text: t("auth.reset.update_failed", "Neizdevās saglabāt jauno paroli."),
      });
      return;
    }

    showFeedback({
      type: "success",
      text: t(
        "auth.reset.success",
        "Parole atjaunota. Vari pierakstīties.",
      ),
    });
    router.replace("/");
    router.refresh();
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
          aria-labelledby="reset-password-title"
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
              id="reset-password-title"
              className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950"
            >
              {t("auth.reset.title", "Jauna parole")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {t(
                "auth.reset.subtitle",
                "Izvēlies jaunu paroli savam kontam.",
              )}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_16px_45px_rgba(24,24,27,0.08)] sm:p-8">
            <form onSubmit={handleSubmit} className="text-left">
              <label className="block text-sm font-medium text-zinc-800">
                {t("auth.email.password_label", "Parole")}
                <span className="relative mt-2 block">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    className={fieldClassName}
                    placeholder="••••••••"
                  />
                  <Tooltip
                    label={showPassword ? hidePasswordLabel : showPasswordLabel}
                    align="end"
                    className="absolute top-1/2 right-1.5 -translate-y-1/2"
                  >
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? hidePasswordLabel : showPasswordLabel
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

              <label className="mt-4 block text-sm font-medium text-zinc-800">
                {t("auth.email.confirm_password_label", "Atkārto paroli")}
                <span className="relative mt-2 block">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    disabled={loading}
                    className={fieldClassName}
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
                      disabled={loading}
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
                {t("auth.reset.submit", "Saglabāt paroli")}
              </button>
            </form>
          </div>
        </section>
      </div>

      <SiteFooter systemName={systemName} bordered layout="centered" />
    </main>
  );
}
