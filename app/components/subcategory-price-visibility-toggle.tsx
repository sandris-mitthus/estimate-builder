"use client";

import { Tooltip } from "@/app/components/tooltip";

type SubcategoryPriceVisibilityToggleProps = {
  hiddenPricesInOffer?: boolean;
  onChange: (hiddenPricesInOffer: boolean) => void;
};

export function SubcategoryPriceVisibilityToggle({
  hiddenPricesInOffer = false,
  onChange,
}: SubcategoryPriceVisibilityToggleProps) {
  const hidden = hiddenPricesInOffer === true;

  return (
    <Tooltip
      label={
        hidden
          ? "Piedāvājuma paslēptas pozīciju cenas"
          : "Piedāvājuma redzamas pozīciju cenas"
      }
    >
      <button
        type="button"
        aria-label={
          hidden
            ? "Piedāvājuma paslēptas pozīciju cenas"
            : "Piedāvājuma redzamas pozīciju cenas"
        }
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
