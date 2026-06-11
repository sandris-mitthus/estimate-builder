"use client";

import { IconActionButton } from "@/app/components/icon-action-button";

type SubcategoryOfferVisibilityToggleProps = {
  hiddenInOffer?: boolean;
  onChange: (hiddenInOffer: boolean) => void;
};

export function SubcategoryOfferVisibilityToggle({
  hiddenInOffer = false,
  onChange,
}: SubcategoryOfferVisibilityToggleProps) {
  const hidden = hiddenInOffer === true;

  return (
    <IconActionButton
      label={
        hidden
          ? "Piedāvājuma paslēptas pozīcijas"
          : "Piedāvājuma redzamas pozicijas"
      }
      icon={hidden ? "fas fa-eye-slash" : "fas fa-eye"}
      variant="edit"
      onClick={() => onChange(!hidden)}
      className="h-7 w-7 shrink-0"
    />
  );
}
