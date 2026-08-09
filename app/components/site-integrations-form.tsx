"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import {
  saveResendSettingsAction,
  setLandingPageEnabledAction,
} from "@/app/(protected)/site_integrations/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { ToggleSwitch } from "@/app/components/ui/toggle-switch";
import type { ResendSettingsPublic } from "@/app/lib/email/resend-config";
import { translateActionError } from "@/app/lib/i18n/action-errors";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-800";

/** Shared shell so every integration reads the same way on the page. */
function IntegrationCard({
  icon,
  title,
  hint,
  enabled,
  toggleLabel,
  onToggle,
  disabled,
  children,
}: {
  icon: string;
  title: string;
  hint: string;
  enabled: boolean;
  toggleLabel: string;
  onToggle: (next: boolean) => void;
  disabled: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslations();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
            <i className={`${icon} text-sm`} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
              <span
                className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                  enabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {enabled
                  ? t("status.enabled", "Ieslēgts")
                  : t("status.disabled", "Izslēgts")}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{hint}</p>
          </div>
        </div>
        <ToggleSwitch
          checked={enabled}
          disabled={disabled}
          label={toggleLabel}
          onChange={onToggle}
        />
      </div>
      {children}
    </section>
  );
}

export function SiteIntegrationsForm({
  initialLandingEnabled,
  initialResend,
}: {
  initialLandingEnabled: boolean;
  initialResend: ResendSettingsPublic;
}) {
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const isBusy = isPending || pendingKey !== null;

  const [landingEnabled, setLandingEnabled] = useState(initialLandingEnabled);

  const [resendEnabled, setResendEnabled] = useState(initialResend.enabled);
  const [emailFrom, setEmailFrom] = useState(initialResend.emailFrom);
  const [apiKey, setApiKey] = useState("");
  const [savedResend, setSavedResend] = useState(initialResend);

  const resendDirty =
    resendEnabled !== savedResend.enabled ||
    emailFrom.trim() !== savedResend.emailFrom.trim() ||
    apiKey.trim().length > 0;

  function handleLandingToggle(next: boolean) {
    clearFeedback();
    const previous = landingEnabled;
    setLandingEnabled(next);

    startTransition(async () => {
      setPendingKey("landing");
      const result = await setLandingPageEnabledAction(next);
      setPendingKey(null);

      if (!result.ok) {
        setLandingEnabled(previous);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: t(
          "site_integrations.landing.saved",
          "Landing page iestatījums saglabāts.",
        ),
      });
    });
  }

  function handleSaveResend(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();
    if (!resendDirty || isBusy) return;

    if (resendEnabled && !emailFrom.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "site_integrations.resend.validation.from_required",
          "Ievadi sūtītāja adresi, lai ieslēgtu Resend.",
        ),
      });
      return;
    }

    if (
      resendEnabled &&
      !apiKey.trim() &&
      !savedResend.hasStoredApiKey &&
      !savedResend.hasEnvApiKey
    ) {
      showFeedback({
        type: "error",
        text: t(
          "site_integrations.resend.validation.key_required",
          "Ievadi Resend API atslēgu vai iestati RESEND_API_KEY vidē.",
        ),
      });
      return;
    }

    startTransition(async () => {
      setPendingKey("resend");
      const result = await saveResendSettingsAction({
        enabled: resendEnabled,
        emailFrom,
        apiKey,
      });
      setPendingKey(null);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setSavedResend(result.settings);
      setEmailFrom(result.settings.emailFrom);
      setApiKey("");
      showFeedback({
        type: "success",
        text: t(
          "site_integrations.resend.saved",
          "Resend iestatījumi saglabāti.",
        ),
      });
    });
  }

  return (
    <div className="space-y-6">
      <IntegrationCard
        icon="fas fa-house-laptop"
        title={t("site_integrations.landing.section", "Landing page")}
        hint={t(
          "site_integrations.landing.section_hint",
          "Publiskā sākumlapa anonīmiem apmeklētājiem ar produkta aprakstu un saitēm uz pierakstīšanos. Kad izslēgts, apmeklētājs uzreiz nonāk pierakstīšanās lapā.",
        )}
        enabled={landingEnabled}
        toggleLabel={t(
          "site_integrations.landing.enabled",
          "Ieslēgt landing page",
        )}
        onToggle={handleLandingToggle}
        disabled={isBusy}
      >
        <p className="mt-4 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
          {t(
            "site_integrations.landing.texts_hint",
            "Landing page tekstus labo sadaļā Tulkojumi — atslēgas sākas ar landing.",
          )}{" "}
          <Link
            href="/site_translations"
            className="font-medium text-zinc-700 underline underline-offset-2 transition hover:text-zinc-900"
          >
            {t("nav.system_admin.site_translations", "Tulkojumi")}
          </Link>
        </p>
      </IntegrationCard>

      <form onSubmit={handleSaveResend}>
        <IntegrationCard
          icon="fas fa-paper-plane"
          title={t("site_integrations.resend.section", "Resend integrācija")}
          hint={t(
            "site_integrations.resend.section_hint",
            "Kad ieslēgts, uzaicinājumi, pieejas paziņojumi un e-pasta reģistrācija tiek sūtīti caur Resend. Bez API atslēgas un sūtītāja adreses e-pasti netiek sūtīti. Šablonus labo sadaļā E-pasta šabloni.",
          )}
          enabled={resendEnabled}
          toggleLabel={t("site_integrations.resend.enabled", "Ieslēgt Resend")}
          onToggle={(next) => {
            clearFeedback();
            setResendEnabled(next);
          }}
          disabled={isBusy}
        >
          <fieldset
            disabled={isBusy}
            className="mt-4 space-y-5 border-t border-zinc-100 pt-5 disabled:opacity-80"
          >
            <div>
              <label htmlFor="resendEmailFrom" className={labelClassName}>
                {t(
                  "site_integrations.resend.email_from",
                  "Sūtītāja adrese (From)",
                )}
              </label>
              <input
                id="resendEmailFrom"
                value={emailFrom}
                onChange={(event) => {
                  clearFeedback();
                  setEmailFrom(event.target.value);
                }}
                className={fieldClassName}
                placeholder="Estimate Builder <noreply@yourdomain.com>"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_integrations.resend.email_from_hint",
                  "Piemērs: Estimate Builder <noreply@yourdomain.com>. Domēnam jābūt verificētam Resend.",
                )}
              </p>
            </div>

            <div>
              <label htmlFor="resendApiKey" className={labelClassName}>
                {t("site_integrations.resend.api_key", "Resend API atslēga")}
              </label>
              <input
                id="resendApiKey"
                type="password"
                value={apiKey}
                onChange={(event) => {
                  clearFeedback();
                  setApiKey(event.target.value);
                }}
                className={fieldClassName}
                placeholder={
                  savedResend.hasStoredApiKey ? "••••••••••••••••" : "re_…"
                }
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {savedResend.hasStoredApiKey
                  ? t(
                      "site_integrations.resend.api_key_hint_set",
                      "Atslēga ir saglabāta. Atstāj tukšu, lai saglabātu esošo, vai ievadi jaunu, lai aizstātu.",
                    )
                  : t(
                      "site_integrations.resend.api_key_hint_empty",
                      "Var arī iestatīt RESEND_API_KEY vides mainīgajā serverī.",
                    )}
              </p>
              {savedResend.hasEnvApiKey ? (
                <p className="mt-1 text-xs text-emerald-700">
                  {t(
                    "site_integrations.resend.env_key_configured",
                    "Serverī ir iestatīts RESEND_API_KEY (vides mainīgais).",
                  )}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isBusy || !resendDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingKey === "resend" ? (
                  <i
                    className="fas fa-circle-notch fa-spin text-xs"
                    aria-hidden="true"
                  />
                ) : null}
                {t(
                  "site_integrations.resend.save",
                  "Saglabāt Resend iestatījumus",
                )}
              </button>
            </div>
          </fieldset>
        </IntegrationCard>
      </form>
    </div>
  );
}
