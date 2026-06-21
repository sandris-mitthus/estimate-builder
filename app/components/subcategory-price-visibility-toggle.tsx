"use client";

import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

type SubcategoryPriceVisibilityToggleProps = {
  hiddenPricesInOffer?: boolean;
  onChange: (hiddenPricesInOffer: boolean) => void;
};

export function SubcategoryPriceVisibilityToggle({
  hiddenPricesInOffer = false,
  onChange,
}: SubcategoryPriceVisibilityToggleProps) {
  const { t } = useTranslations();
  const hidden = hiddenPricesInOffer === true;
  const label = hidden
    ? t("estimate.offer.subcategory_prices_hidden", "Piedāvājuma paslēptas pozīciju cenas")
    : t("estimate.offer.subcategory_prices_visible", "Piedāvājuma redzamas pozīciju cenas");

  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={() => onChange(!hidden)}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
          hidden
            ? "text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        }`}
      >
        <i className="fas fa-stream text-sm" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
