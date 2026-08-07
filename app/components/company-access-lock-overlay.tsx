"use client";

import { useTranslations } from "@/app/components/translations-provider";
import type { CompanyAccessLockReason } from "@/app/lib/payment-plans/helpers";

export function CompanyAccessLockOverlay({
  reason,
}: {
  reason: CompanyAccessLockReason;
}) {
  const { t } = useTranslations();

  const copy =
    reason === "blocked"
      ? {
          title: t(
            "payment_plan.lock.blocked_title",
            "Pieeja sistēmai ir liegta",
          ),
          description: t(
            "payment_plan.lock.blocked_description",
            "Sazinies ar sistēmas administratoru, lai atjaunotu pieeju.",
          ),
        }
      : reason === "missing_until"
        ? {
            title: t(
              "payment_plan.lock.missing_until_title",
              "Nav norādīts maksas plāna termiņš",
            ),
            description: t(
              "payment_plan.lock.missing_until_description",
              "Sazinies ar sistēmas administratoru, lai atjaunotu pieeju.",
            ),
          }
        : {
            title: t(
              "payment_plan.lock.expired_title",
              "Maksas plānam beidzies termiņš",
            ),
            description: t(
              "payment_plan.lock.expired_description",
              "Sazinies ar sistēmas administratoru, lai atjaunotu pieeju.",
            ),
          };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-900/50 p-6 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="company-access-lock-title"
      aria-describedby="company-access-lock-description"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <i className="fas fa-lock text-lg" aria-hidden="true" />
        </div>
        <h2
          id="company-access-lock-title"
          className="text-lg font-semibold text-zinc-900"
        >
          {copy.title}
        </h2>
        <p
          id="company-access-lock-description"
          className="mt-2 text-sm text-zinc-600"
        >
          {copy.description}
        </p>
      </div>
    </div>
  );
}
