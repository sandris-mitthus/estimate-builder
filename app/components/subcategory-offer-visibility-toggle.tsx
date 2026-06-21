"use client";

import { IconActionButton } from "@/app/components/icon-action-button";
import { useTranslations } from "@/app/components/translations-provider";

type SubcategoryOfferVisibilityToggleProps = {
  hiddenInOffer?: boolean;
  onChange: (hiddenInOffer: boolean) => void;
};

export function SubcategoryOfferVisibilityToggle({
  hiddenInOffer = false,
  onChange,
}: SubcategoryOfferVisibilityToggleProps) {
  const { t } = useTranslations();
  const hidden = hiddenInOffer === true;

  return (
    <IconActionButton
      label={
        hidden
          ? t("estimate.offer.subcategory_hidden", "Piedāvājuma paslēptas pozīcijas")
          : t("estimate.offer.subcategory_visible", "Piedāvājuma redzamas pozīcijas")
      }
      icon={hidden ? "fas fa-eye-slash" : "fas fa-eye"}
      variant="edit"
      onClick={() => onChange(!hidden)}
      className="h-7 w-7 shrink-0"
    />
  );
}
