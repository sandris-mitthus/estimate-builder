"use client";

import { IconActionButton } from "@/app/components/icon-action-button";
import { useTranslations } from "@/app/components/translations-provider";

type LineItemPriceVisibilityToggleProps = {
  hiddenPriceInOffer?: boolean;
  onChange: (hiddenPriceInOffer: boolean) => void;
  className?: string;
};

export function LineItemPriceVisibilityToggle({
  hiddenPriceInOffer = false,
  onChange,
  className = "",
}: LineItemPriceVisibilityToggleProps) {
  const { t } = useTranslations();
  const hidden = hiddenPriceInOffer === true;

  return (
    <IconActionButton
      label={
        hidden
          ? t("estimate.offer.line_price_hidden", "Piedāvājuma paslēpta pozīcijas cena")
          : t("estimate.offer.line_price_visible", "Piedāvājuma redzama pozīcijas cena")
      }
      icon={hidden ? "fas fa-eye-slash" : "fas fa-eye"}
      variant="edit"
      onClick={() => onChange(!hidden)}
      className={`h-7 w-7 shrink-0 ${
        hidden ? "text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600" : ""
      } ${className}`.trim()}
    />
  );
}
