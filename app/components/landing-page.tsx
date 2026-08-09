import Link from "next/link";
import { AuthHashRedirect } from "@/app/components/auth-session-from-url";
import { PublicLanguageSelector } from "@/app/components/public-language-selector";
import { SiteFooter } from "@/app/components/site-footer";
import { getServerTranslations } from "@/app/lib/i18n/server";
import {
  resolveLocalizedValue,
  type PaymentPlanSummary,
} from "@/app/lib/payment-plans/helpers";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/repository";

const primaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800";

const secondaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50";

const MODULE_LABEL_FALLBACKS: Record<string, string> = {
  module_todo_list: "Darāmo darbu saraksts",
  module_workers: "Darbinieki",
  module_tools: "Instrumenti",
  module_timeline_graph: "Laika grafiks",
  module_additional_work: "Papildu darbu tāmes",
  module_profit: "Plānotā peļņa",
  module_delegated_orders: "Materiālu pasūtīšana un deleģēšana",
};

export async function LandingPage({
  systemName,
  slogan,
  logoUrl = "",
  languages = [],
  activeLanguageCode = "lv",
  paymentPlans = [],
  trialDays = null,
  trialPlanId = null,
}: {
  systemName: string;
  slogan: string;
  logoUrl?: string;
  languages?: SiteLanguageSummary[];
  activeLanguageCode?: string;
  /** Empty when payment plans are off — the pricing section is then hidden. */
  paymentPlans?: PaymentPlanSummary[];
  trialDays?: number | null;
  trialPlanId?: string | null;
}) {
  const { t, languageCode } = await getServerTranslations();
  const showPricing = paymentPlans.length > 0;
  const recommendedPlanId =
    (trialPlanId && paymentPlans.some((plan) => plan.id === trialPlanId)
      ? trialPlanId
      : null) ??
    paymentPlans.reduce<string | null>((bestId, plan) => {
      if (!bestId) return plan.id;
      const best = paymentPlans.find((item) => item.id === bestId);
      if (!best) return plan.id;
      if (plan.moduleKeys.length > best.moduleKeys.length) return plan.id;
      return bestId;
    }, null);

  const features = [
    {
      icon: "fa-table-list",
      title: t("landing.features.estimates.title", "Tāmes redaktors"),
      description: t(
        "landing.features.estimates.description",
        "Kategorijas, apakškategorijas un pozīcijas ar pārvilkšanu. Summas pārrēķinās uzreiz, kolonnas pielāgojamas katram projektam.",
      ),
    },
    {
      icon: "fa-layer-group",
      title: t("landing.features.template.title", "Kopīgā sagatave"),
      description: t(
        "landing.features.template.description",
        "Viena izcenojumu sagatave visiem projektiem. Kad cena mainās, sistēma parāda, kuras tāmes to vēl nav pārņēmušas.",
      ),
    },
    {
      icon: "fa-tags",
      title: t("landing.features.catalog.title", "Izcenojumu katalogs"),
      description: t(
        "landing.features.catalog.description",
        "Darbu un materiālu izcenojumi ar mērvienībām, normām un cenām. Atrodi un pievieno pozīciju bez atkārtotas ievades.",
      ),
    },
    {
      icon: "fa-cubes",
      title: t("landing.features.modules.title", "Ēku moduļi"),
      description: t(
        "landing.features.modules.description",
        "Atkārtojami mezgli ar saviem daudzumiem un datiem. Pievieno moduli tāmei, un pozīcijas ar apjomiem ienāk automātiski.",
      ),
    },
    {
      icon: "fa-file-export",
      title: t("landing.features.exports.title", "Piedāvājumi PDF un Excel"),
      description: t(
        "landing.features.exports.description",
        "Klienta piedāvājums vienā klikšķī. Rādi detalizētas rindas vai tikai kopsummu, ar uzņēmuma rekvizītiem.",
      ),
    },
    {
      icon: "fa-boxes-stacked",
      title: t("landing.features.materials.title", "Materiālu pasūtīšana"),
      description: t(
        "landing.features.materials.description",
        "Pēc tāmes apstiprināšanas redzi materiālu sarakstu, atzīmē pasūtīto un deleģē katru pozīciju atbildīgajam.",
      ),
    },
  ];

  const steps = [
    {
      title: t("landing.workflow.step1.title", "Izveido projektu"),
      description: t(
        "landing.workflow.step1.description",
        "Pievieno klientu, termiņus un pozīcijas no kataloga vai ēku moduļiem.",
      ),
    },
    {
      title: t("landing.workflow.step2.title", "Sagatavo piedāvājumu"),
      description: t(
        "landing.workflow.step2.description",
        "Pārbaudi apjomus, pievieno plānoto peļņu un eksportē PDF vai Excel.",
      ),
    },
    {
      title: t("landing.workflow.step3.title", "Vadi izpildi"),
      description: t(
        "landing.workflow.step3.description",
        "Apstiprini tāmi, pasūti materiālus un seko, kas kuram ir deleģēts.",
      ),
    },
  ];

  const signInLabel = t("auth.email.login_submit", "Pierakstīties");
  const signUpLabel = t("auth.email.register_submit", "Izveidot kontu");
  const planCtaLabel = t("landing.pricing.cta", "Sākt ar šo plānu");
  const coreIncludedLabel = t(
    "landing.pricing.core_included",
    "Tāmes redaktors, katalogs un piedāvājumi",
  );

  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-950">
      <AuthHashRedirect />

      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-3.5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-8 w-auto max-w-[130px] object-contain"
              />
            ) : (
              <span
                className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white"
                aria-hidden="true"
              >
                {systemName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-[15px] font-semibold tracking-[-0.03em] text-zinc-950">
              {systemName}
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              {t("landing.nav.features", "Iespējas")}
            </a>
            <a
              href="#workflow"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              {t("landing.nav.workflow", "Kā tas strādā")}
            </a>
            {showPricing ? (
              <a
                href="#pricing"
                className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                {t("landing.nav.pricing", "Plāni")}
              </a>
            ) : null}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <PublicLanguageSelector
              languages={languages}
              activeLanguageCode={activeLanguageCode}
            />
            <Link
              href="/login"
              className="hidden text-sm font-medium text-zinc-600 transition hover:text-zinc-900 sm:inline-flex"
            >
              {signInLabel}
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              {signUpLabel}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_-10%,#ffffff_0%,#f6f6f7_45%,#ececee_100%)]"
          aria-hidden="true"
        />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {t("landing.hero.eyebrow", "Tāmju sistēma būvniecībai")}
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.06] tracking-[-0.055em] text-zinc-950 sm:text-5xl lg:text-[3.35rem]">
              {t(
                "landing.hero.title",
                "Būvniecības tāmes, kas paliek precīzas līdz pēdējam materiālam",
              )}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
              {t(
                "landing.hero.description",
                "Izcenojumu katalogs, tāmju redaktors un materiālu plūsma vienā sistēmā. Sagatavo tāmi, izveido klientam piedāvājumu un seko, kas jāpasūta, kad projekts ir apstiprināts.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={primaryButtonClassName}>
                {signUpLabel}
                <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
              </Link>
              <Link href="/login" className={secondaryButtonClassName}>
                {signInLabel}
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              {t(
                "landing.hero.note",
                "Pieslēdzies ar Google vai izveido kontu ar e-pastu.",
              )}
            </p>
          </div>

          <EstimatePreview t={t} />
        </div>
      </section>

      <section
        id="features"
        aria-labelledby="landing-features-title"
        className="border-t border-zinc-200 bg-zinc-50"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              {t("landing.nav.features", "Iespējas")}
            </p>
            <h2
              id="landing-features-title"
              className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-zinc-950 sm:text-4xl"
            >
              {t("landing.features.title", "Viss, kas vajadzīgs tāmes ceļam")}
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              {t(
                "landing.features.subtitle",
                "No pirmās pozīcijas līdz apstiprinātam projektam un materiālu pasūtījumiem.",
              )}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-900/5 text-[15px] text-zinc-700">
                  <i className={`fas ${feature.icon}`} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-[-0.02em] text-zinc-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="workflow"
        aria-labelledby="landing-workflow-title"
        className="border-t border-zinc-200 bg-white"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <h2
            id="landing-workflow-title"
            className="max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-zinc-950 sm:text-4xl"
          >
            {t("landing.workflow.title", "Kā tas strādā")}
          </h2>

          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="border-t border-zinc-200 pt-6 md:pr-6"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-zinc-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {showPricing ? (
        <section
          id="pricing"
          aria-labelledby="landing-pricing-title"
          className="border-t border-zinc-200 bg-zinc-50"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {t("landing.nav.pricing", "Plāni")}
              </p>
              <h2
                id="landing-pricing-title"
                className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-zinc-950 sm:text-4xl"
              >
                {t("landing.pricing.title", "Izvēlies plānu")}
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-600">
                {t(
                  "landing.pricing.subtitle",
                  "Katrs plāns ietver pamata tāmes iespējas. Zemāk — kas papildus ietilpst katrā līmenī.",
                )}
              </p>
              {trialDays && trialPlanId ? (
                <p className="mt-3 text-sm font-medium text-zinc-500">
                  {t(
                    "landing.pricing.trial_note",
                    "Jauns uzņēmums sāk ar {days} dienu izmēģinājumu.",
                    { days: trialDays },
                  )}
                </p>
              ) : null}
            </div>

            <div
              className={`mt-12 grid gap-5 ${
                paymentPlans.length === 1
                  ? "mx-auto max-w-md"
                  : paymentPlans.length === 2
                    ? "mx-auto max-w-3xl md:grid-cols-2"
                    : "lg:grid-cols-3"
              }`}
            >
              {paymentPlans.map((plan) => {
                const name =
                  resolveLocalizedValue(plan.nameValues, languageCode) ||
                  plan.planKey;
                const description = resolveLocalizedValue(
                  plan.descriptionValues,
                  languageCode,
                ).trim();
                const recommended = plan.id === recommendedPlanId;
                const moduleLabels = plan.moduleKeys.map((moduleKey) =>
                  t(
                    `frontend_modules.label.${moduleKey}`,
                    MODULE_LABEL_FALLBACKS[moduleKey] ?? moduleKey,
                  ),
                );

                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                      recommended
                        ? "border-zinc-900 ring-1 ring-zinc-900"
                        : "border-zinc-200"
                    }`}
                  >
                    {recommended ? (
                      <span className="absolute -top-3 left-6 inline-flex rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                        {t("landing.pricing.recommended", "Ieteicams")}
                      </span>
                    ) : null}

                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-zinc-950">
                      {name}
                    </h3>
                    {description ? (
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {description}
                      </p>
                    ) : null}

                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                      {t("landing.pricing.modules_heading", "Ietilpst")}
                    </p>
                    <ul className="mt-3 flex-1 space-y-2.5">
                      <li className="flex items-start gap-2.5 text-sm text-zinc-700">
                        <i
                          className="fas fa-check mt-1 text-[10px] text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>{coreIncludedLabel}</span>
                      </li>
                      {moduleLabels.length > 0 ? (
                        moduleLabels.map((label) => (
                          <li
                            key={label}
                            className="flex items-start gap-2.5 text-sm text-zinc-700"
                          >
                            <i
                              className="fas fa-check mt-1 text-[10px] text-emerald-600"
                              aria-hidden="true"
                            />
                            <span>{label}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-2.5 text-sm text-zinc-500">
                          <i
                            className="fas fa-minus mt-1 text-[10px] text-zinc-300"
                            aria-hidden="true"
                          />
                          <span>
                            {t(
                              "landing.pricing.modules_empty",
                              "Tikai pamata iespējas",
                            )}
                          </span>
                        </li>
                      )}
                    </ul>

                    <Link
                      href="/signup"
                      className={`mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition ${
                        recommended
                          ? "bg-zinc-900 text-white hover:bg-zinc-800"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      {planCtaLabel}
                      <i
                        className="fas fa-arrow-right text-xs"
                        aria-hidden="true"
                      />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white px-5 pb-20 lg:px-8">
        <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-zinc-900 px-7 py-12 text-center md:px-14 md:py-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
            {t("landing.cta.title", "Sāc pirmo tāmi jau šodien")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-zinc-400">
            {t(
              "landing.cta.description",
              "Izveido kontu, pievieno uzņēmuma datus un strādā ar reāliem projektiem.",
            )}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              {signUpLabel}
              <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {signInLabel}
            </Link>
          </div>
          <p className="mt-8 text-sm text-zinc-500">{slogan}</p>
        </div>
      </section>

      <SiteFooter systemName={systemName} bordered />
    </main>
  );
}

/** Static product mock for the hero — mirrors the estimate table layout. */
function EstimatePreview({
  t,
}: {
  t: (key: string, fallback?: string) => string;
}) {
  const rows = [
    {
      name: t("landing.preview.row_1", "Betona pamatu izbūve"),
      quantity: "48 m³",
      total: "9 840.00",
    },
    {
      name: t("landing.preview.row_2", "Pamatu hidroizolācija"),
      quantity: "126 m²",
      total: "2 268.00",
    },
    {
      name: t("landing.preview.row_3", "Grunts blietēšana"),
      quantity: "310 m²",
      total: "1 395.00",
    },
  ];

  return (
    <div className="relative" aria-hidden="true">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_28px_70px_rgba(24,24,27,0.14)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-950">
              {t("landing.preview.project", "Dzīvojamā māja Jūrmalā")}
            </p>
            <p className="mt-1 text-xs text-zinc-400">2026-08-14</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <i className="fas fa-check text-[9px]" />
            {t("landing.preview.status", "Apstiprināts")}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_auto] gap-x-5 border-b border-zinc-200 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          <span>{t("common.name", "Nosaukums")}</span>
          <span className="text-right">{t("estimate.quantity", "Daudzums")}</span>
          <span className="text-right">{t("common.total", "Kopā")}</span>
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {t("landing.preview.category", "Pamati un pagrabs")}
        </p>

        <div className="mt-1 divide-y divide-zinc-100">
          {rows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-5 py-2.5 text-sm"
            >
              <span className="truncate text-zinc-700">{row.name}</span>
              <span className="text-right text-zinc-500">{row.quantity}</span>
              <span className="text-right font-medium tabular-nums text-zinc-900">
                {row.total}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-zinc-200 pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("common.total", "Kopā")}
          </span>
          <span className="text-xl font-semibold tracking-[-0.03em] tabular-nums text-zinc-950">
            € 13 503.00
          </span>
        </div>
      </div>

      <div className="absolute -bottom-11 -left-5 hidden rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(24,24,27,0.14)] sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {t("estimate.planned_profit", "Plānotā peļņa")}
        </p>
        <p className="mt-1 text-lg font-semibold tracking-[-0.03em] tabular-nums text-zinc-950">
          12%
        </p>
      </div>
    </div>
  );
}
