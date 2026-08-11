"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import {
  saveGoogleAuthSettingsAction,
  saveResendSettingsAction,
  setLandingPageEnabledAction,
} from "@/app/(protected)/site_integrations/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { ToggleSwitch } from "@/app/components/ui/toggle-switch";
import type { ResendSettingsPublic } from "@/app/lib/email/resend-config";
import type { GoogleAuthSettingsPublic } from "@/app/lib/integrations/google-auth";
import { translateActionError } from "@/app/lib/i18n/action-errors";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-800";
const monoUrlClassName =
  "mt-1 break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-[12px] text-zinc-700";

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
  initialGoogleAuth,
}: {
  initialLandingEnabled: boolean;
  initialResend: ResendSettingsPublic;
  initialGoogleAuth: GoogleAuthSettingsPublic;
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

  const [googleEnabled, setGoogleEnabled] = useState(initialGoogleAuth.enabled);
  const [allowedDomain, setAllowedDomain] = useState(
    initialGoogleAuth.allowedEmailDomain,
  );
  const [clientIdDisplay, setClientIdDisplay] = useState(
    initialGoogleAuth.clientIdDisplay,
  );
  const [savedGoogle, setSavedGoogle] = useState(initialGoogleAuth);

  const resendDirty =
    resendEnabled !== savedResend.enabled ||
    emailFrom.trim() !== savedResend.emailFrom.trim() ||
    apiKey.trim().length > 0;

  const googleDirty =
    googleEnabled !== savedGoogle.enabled ||
    allowedDomain.trim().toLowerCase().replace(/^@/, "") !==
      savedGoogle.allowedEmailDomain ||
    clientIdDisplay.trim() !== savedGoogle.clientIdDisplay;

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

  function handleSaveGoogle(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();
    if (!googleDirty || isBusy) return;

    startTransition(async () => {
      setPendingKey("google");
      const result = await saveGoogleAuthSettingsAction({
        enabled: googleEnabled,
        allowedEmailDomain: allowedDomain,
        clientIdDisplay,
      });
      setPendingKey(null);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setSavedGoogle(result.settings);
      setGoogleEnabled(result.settings.enabled);
      setAllowedDomain(result.settings.allowedEmailDomain);
      setClientIdDisplay(result.settings.clientIdDisplay);
      showFeedback({
        type: "success",
        text: t(
          "site_integrations.google.saved",
          "Google autentifikācijas iestatījumi saglabāti.",
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

      <form onSubmit={handleSaveGoogle}>
        <IntegrationCard
          icon="fab fa-google"
          title={t(
            "site_integrations.google.section",
            "Google autentifikācija",
          )}
          hint={t(
            "site_integrations.google.section_hint",
            "Pierakstīšanās ar Google caur Supabase Auth. Client ID un Secret jāievada Supabase panelī; šeit — ieslēgšana, e-pasta domēna ierobežojums un iestatīšanas kontrolsaraksts (piem. uupis.com).",
          )}
          enabled={googleEnabled}
          toggleLabel={t(
            "site_integrations.google.enabled",
            "Ieslēgt Google pierakstīšanos",
          )}
          onToggle={(next) => {
            clearFeedback();
            setGoogleEnabled(next);
          }}
          disabled={isBusy}
        >
          <fieldset
            disabled={isBusy}
            className="mt-4 space-y-5 border-t border-zinc-100 pt-5 disabled:opacity-80"
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
              {savedGoogle.usesCustomSupabaseDomain ? (
                <>
                  <p className="font-semibold">
                    {t(
                      "site_integrations.google.mode_custom_title",
                      "Pašlaik: custom domain",
                    )}
                  </p>
                  <p className="mt-1">
                    {t(
                      "site_integrations.google.mode_custom_body",
                      "NEXT_PUBLIC_SUPABASE_URL jau ir custom host ({host}). Google „Pāriet uz lietotni” jārāda šis domēns.",
                      { host: savedGoogle.supabaseHost },
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">
                    {t(
                      "site_integrations.google.mode_free_title",
                      "Pašlaik: Free plāns",
                    )}
                  </p>
                  <p className="mt-1">
                    {t(
                      "site_integrations.google.mode_free_body",
                      "Google login strādā ar Supabase noklusējuma hostu. Google ekrānā redzēsi „Pāriet uz lietotni …” ar {host}. Tas ir normāli — nekā nav jālauž.",
                      {
                        host:
                          savedGoogle.supabaseHost ||
                          "….supabase.co",
                      },
                    )}
                  </p>
                  <p className="mt-3 font-semibold">
                    {t(
                      "site_integrations.google.consent_notice_title",
                      "Kāpēc Google rāda …supabase.co?",
                    )}
                  </p>
                  <p className="mt-1">
                    {t(
                      "site_integrations.google.consent_notice_body",
                      "Ekrānā „Pāriet uz lietotni …” Google rāda OAuth redirect URI hostu. Pašlaik tas ir {callback}. Free plānā Custom Domain nav pieejams, tāpēc host paliek *.supabase.co.",
                      {
                        callback:
                          savedGoogle.supabaseGoogleCallbackUrl ||
                          "https://….supabase.co/auth/v1/callback",
                      },
                    )}
                  </p>
                </>
              )}

              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/70">
                    {t(
                      "site_integrations.google.current_callback_label",
                      "Pašreizējais Google callback (tagad)",
                    )}
                  </p>
                  <p className="mt-1 break-all font-mono text-[12px]">
                    {savedGoogle.supabaseGoogleCallbackUrl || "—"}
                  </p>
                </div>
                {!savedGoogle.usesCustomSupabaseDomain ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/70">
                      {t(
                        "site_integrations.google.planned_callback_label",
                        "Nākotnes Google callback (pēc Pro)",
                      )}
                    </p>
                    <p className="mt-1 break-all font-mono text-[12px]">
                      {savedGoogle.plannedGoogleCallbackUrl}
                    </p>
                  </div>
                ) : null}
              </div>

              {!savedGoogle.usesCustomSupabaseDomain ? (
                <>
                  <p className="mt-3 font-semibold">
                    {t(
                      "site_integrations.google.consent_fix_title",
                      "Kad pāriesi uz maksas Supabase — soļi uz api.uupis.com",
                    )}
                  </p>
                  <ol className="mt-1 list-decimal space-y-1 pl-4">
                    <li>
                      {t(
                        "site_integrations.google.consent_fix_1",
                        "1. Upgrade uz Pro (vai augstāku) → Settings → Add-ons → Custom Domain. DNS: CNAME api → tavs pašreizējais *.supabase.co. Host: api.uupis.com.",
                      )}
                    </li>
                    <li>
                      {t(
                        "site_integrations.google.consent_fix_2",
                        "2. Google Cloud → OAuth Client → Authorized redirect URIs pievieno https://api.uupis.com/auth/v1/callback (veco *.supabase.co/auth/v1/callback atstāj līdz pārejai).",
                      )}
                    </li>
                    <li>
                      {t(
                        "site_integrations.google.consent_fix_3",
                        "3. Supabase: verify + activate custom domain. Pēc tam Google rādīs api.uupis.com.",
                      )}
                    </li>
                    <li>
                      {t(
                        "site_integrations.google.consent_fix_4",
                        "4. Vercel: NEXT_PUBLIC_SUPABASE_URL=https://api.uupis.com → Redeploy. NEXT_PUBLIC_SITE_URL paliek https://uupis.com. Šīs lapas URL checklist atjaunosies automātiski.",
                      )}
                    </li>
                  </ol>
                  <p className="mt-2">
                    <a
                      href="https://supabase.com/docs/guides/platform/custom-domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline underline-offset-2"
                    >
                      {t(
                        "site_integrations.google.consent_docs_link",
                        "Supabase Custom Domains dokumentācija",
                      )}
                    </a>
                  </p>
                </>
              ) : null}
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {t(
                  "site_integrations.google.checklist_title",
                  "Iestatīšanas kontrolsaraksts",
                )}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_integrations.google.checklist_intro",
                  "Lai Google login strādātu uz produkta domēna (piem. uupis.com), pārbaudi šos soļus:",
                )}
              </p>

              <ol className="mt-3 space-y-3 text-xs text-zinc-600">
                <li>
                  <p>
                    {t(
                      "site_integrations.google.checklist_1",
                      "1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client. Authorized redirect URI:",
                    )}
                  </p>
                  <p className={monoUrlClassName}>
                    {savedGoogle.supabaseGoogleCallbackUrl || "—"}
                  </p>
                </li>
                <li>
                  {t(
                    "site_integrations.google.checklist_2",
                    "2. Supabase → Authentication → Providers → Google → Enable, ielīmē Client ID un Client Secret.",
                  )}
                </li>
                <li>
                  <p>
                    {t(
                      "site_integrations.google.checklist_3",
                      "3. Supabase → Authentication → URL Configuration → Site URL un Redirect URLs pievieno:",
                    )}
                  </p>
                  <p className={monoUrlClassName}>
                    {savedGoogle.appCallbackUrl || "—"}
                  </p>
                  <p className={monoUrlClassName}>
                    {savedGoogle.appConfirmUrl || "—"}
                  </p>
                </li>
                <li>
                  {t(
                    "site_integrations.google.checklist_4",
                    "4. Vercel → Environment Variables: NEXT_PUBLIC_SITE_URL = tavs produkta URL (piem. https://uupis.com), tad Redeploy.",
                  )}
                </li>
              </ol>

              <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {t(
                    "site_integrations.google.site_url_label",
                    "Pašreizējais NEXT_PUBLIC_SITE_URL",
                  )}
                </p>
                <p className="mt-1 break-all font-mono text-[12px] text-zinc-700">
                  {savedGoogle.siteUrl ||
                    t(
                      "site_integrations.google.site_url_missing",
                      "Nav iestatīts — iestati Vercel (vai .env) uz https://uupis.com",
                    )}
                </p>
                {savedGoogle.supabaseGoogleCallbackUrl ? (
                  <>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      {t(
                        "site_integrations.google.supabase_callback_label",
                        "Supabase Google callback (Google Cloud Console)",
                      )}
                    </p>
                    <p className="mt-1 break-all font-mono text-[12px] text-zinc-700">
                      {savedGoogle.supabaseGoogleCallbackUrl}
                    </p>
                  </>
                ) : null}
                {savedGoogle.appCallbackUrl ? (
                  <>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      {t(
                        "site_integrations.google.app_callback_label",
                        "Lietotnes callback (Redirect URL)",
                      )}
                    </p>
                    <p className="mt-1 break-all font-mono text-[12px] text-zinc-700">
                      {savedGoogle.appCallbackUrl}
                    </p>
                  </>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="googleAllowedDomain" className={labelClassName}>
                {t(
                  "site_integrations.google.allowed_domain",
                  "Atļautais e-pasta domēns",
                )}
              </label>
              <input
                id="googleAllowedDomain"
                value={allowedDomain}
                onChange={(event) => {
                  clearFeedback();
                  setAllowedDomain(event.target.value);
                }}
                className={fieldClassName}
                placeholder="uupis.com"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_integrations.google.allowed_domain_hint",
                  "Piemērs: uupis.com — tad pēc Google login tiek ielaisti tikai @uupis.com e-pasti. Tukšs = bez ierobežojuma. Var arī iestatīt ALLOWED_EMAIL_DOMAIN vidē.",
                )}
              </p>
              {savedGoogle.hasEnvAllowedDomain ? (
                <p className="mt-1 text-xs text-emerald-700">
                  {t(
                    "site_integrations.google.env_domain_configured",
                    "Serverī ir iestatīts ALLOWED_EMAIL_DOMAIN (vides mainīgais). DB vērtība tiek izmantota, ja tā nav tukša.",
                  )}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="googleClientIdDisplay" className={labelClassName}>
                {t(
                  "site_integrations.google.client_id",
                  "Google Client ID (piezīme)",
                )}
              </label>
              <input
                id="googleClientIdDisplay"
                value={clientIdDisplay}
                onChange={(event) => {
                  clearFeedback();
                  setClientIdDisplay(event.target.value);
                }}
                className={fieldClassName}
                placeholder="123456789-….apps.googleusercontent.com"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_integrations.google.client_id_hint",
                  "Tikai atsaucei. OAuth Client ID un Secret jāielīmē Supabase → Authentication → Providers → Google — šeit tie netiek izmantoti autentifikācijai.",
                )}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isBusy || !googleDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingKey === "google" ? (
                  <i
                    className="fas fa-circle-notch fa-spin text-xs"
                    aria-hidden="true"
                  />
                ) : null}
                {t(
                  "site_integrations.google.save",
                  "Saglabāt Google iestatījumus",
                )}
              </button>
            </div>
          </fieldset>
        </IntegrationCard>
      </form>

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
