"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { formatMoney } from "@/app/lib/estimates/format-money";
import {
  getPaymentPlanPriceForPeriod,
  listAvailablePaymentPlanBillingPeriods,
  paymentPlanHasPriceForPeriod,
  resolveLocalizedValue,
  type PaymentPlanBillingPeriod,
  type PaymentPlanSummary,
} from "@/app/lib/payment-plans/helpers";

const MODULE_LABEL_FALLBACKS: Record<string, string> = {
  module_todo_list: "Darāmo darbu saraksts",
  module_workers: "Darbinieki",
  module_tools: "Instrumenti",
  module_timeline_graph: "Laika grafiks",
  module_additional_work: "Papildu darbu tāmes",
  module_profit: "Plānotā peļņa",
  module_delegated_orders: "Materiālu deleģēšana",
};

type LandingPricingCardsProps = {
  plans: PaymentPlanSummary[];
  languageCode: string;
  recommendedPlanId: string | null;
  trialNote: string | null;
  earlyBirdAvailable: boolean;
  earlyBirdRemaining: number | null;
  coreIncludedLabel: string;
  planCtaLabel: string;
};

export function LandingPricingCards({
  plans,
  languageCode,
  recommendedPlanId,
  trialNote,
  earlyBirdAvailable,
  earlyBirdRemaining,
  coreIncludedLabel,
  planCtaLabel,
}: LandingPricingCardsProps) {
  const { t } = useTranslations();

  const availablePeriods = useMemo(
    () =>
      listAvailablePaymentPlanBillingPeriods(plans, {
        earlyBird: earlyBirdAvailable,
      }),
    [plans, earlyBirdAvailable],
  );

  const [period, setPeriod] = useState<PaymentPlanBillingPeriod>(
    () => availablePeriods[0] ?? "month",
  );

  useEffect(() => {
    if (
      availablePeriods.length > 0 &&
      !availablePeriods.includes(period)
    ) {
      setPeriod(availablePeriods[0]);
    }
  }, [availablePeriods, period]);

  const periodLabels: Record<PaymentPlanBillingPeriod, string> = {
    month: t("landing.pricing.period.month", "Mēnesis"),
    quarter: t("landing.pricing.period.quarter", "Ceturksnis"),
    year: t("landing.pricing.period.year", "Gads"),
  };

  const periodShort: Record<PaymentPlanBillingPeriod, string> = {
    month: t("site_payment_plans.period.month_short", "/ mēn."),
    quarter: t("site_payment_plans.period.quarter_short", "/ cet."),
    year: t("site_payment_plans.period.year_short", "/ gadā"),
  };

  return (
    <div>
      {availablePeriods.length > 1 ? (
        <div className="mx-auto flex w-fit items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          {availablePeriods.map((item) => {
            const active = item === period;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                {periodLabels[item]}
              </button>
            );
          })}
        </div>
      ) : null}

      {trialNote ? (
        <p
          className={`${availablePeriods.length > 1 ? "mt-4" : ""} text-center text-sm font-medium text-zinc-500`}
        >
          {trialNote}
        </p>
      ) : null}

      {earlyBirdAvailable && earlyBirdRemaining != null ? (
        <p
          className={`${trialNote || availablePeriods.length > 1 ? "mt-3" : ""} text-center text-sm font-medium text-violet-700`}
        >
          {t(
            "landing.pricing.early_bird_slots",
            "Atlikušas Early Bird vietas: {remaining}",
            { remaining: earlyBirdRemaining },
          )}
        </p>
      ) : null}

      <div
        className={`mt-10 grid gap-5 ${
          plans.length === 1
            ? "mx-auto max-w-md"
            : plans.length === 2
              ? "mx-auto max-w-3xl md:grid-cols-2"
              : "lg:grid-cols-3"
        }`}
      >
        {plans.map((plan) => {
          const name =
            resolveLocalizedValue(plan.nameValues, languageCode) ||
            plan.planKey;
          const description = resolveLocalizedValue(
            plan.descriptionValues,
            languageCode,
          ).trim();
          const recommended = plan.id === recommendedPlanId;
          const periodOffered = paymentPlanHasPriceForPeriod(plan, period, {
            earlyBird: earlyBirdAvailable,
          });
          const regularPrice = getPaymentPlanPriceForPeriod(plan, period);
          const earlyBirdPrice = getPaymentPlanPriceForPeriod(plan, period, {
            earlyBird: true,
          });
          const displayPrice =
            earlyBirdAvailable && earlyBirdPrice > 0
              ? earlyBirdPrice
              : regularPrice;
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

              {earlyBirdAvailable ? (
                <span
                  className={`absolute ${
                    recommended ? "-top-3 right-6" : "-top-3 left-6"
                  } inline-flex rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white`}
                >
                  {t("landing.pricing.early_bird_badge", "Early Bird")}
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

              <div className="mt-5">
                {periodOffered ? (
                  <>
                    {earlyBirdAvailable &&
                    earlyBirdPrice > 0 &&
                    earlyBirdPrice !== regularPrice &&
                    regularPrice > 0 ? (
                      <p className="text-sm text-zinc-400 line-through tabular-nums">
                        {formatMoney(regularPrice, "EUR")}
                      </p>
                    ) : null}
                    <p className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold tracking-[-0.04em] tabular-nums text-zinc-950">
                        {formatMoney(displayPrice, "EUR")}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {periodShort[period]}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">
                    {t(
                      "landing.pricing.period_not_offered",
                      "Šis periods šim plānam nav pieejams",
                    )}
                  </p>
                )}
              </div>

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
                <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
