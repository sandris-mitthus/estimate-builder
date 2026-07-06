"use client";

import { IconActionButton } from "@/app/components/icon-action-button";
import { useTranslations } from "@/app/components/translations-provider";

type LineItemTotalOnlyToggleProps = {
  showOnlyTotalPrice?: boolean;
  onChange: (showOnlyTotalPrice: boolean) => void;
  className?: string;
};

export function LineItemTotalOnlyToggle({
  showOnlyTotalPrice = false,
  onChange,
  className = "",
}: LineItemTotalOnlyToggleProps) {
  const { t } = useTranslations();
  const showOnlyTotal = showOnlyTotalPrice === true;

  return (
    <IconActionButton
      label={
        showOnlyTotal
          ? t(
              "estimate.offer.show_full_breakdown",
              "Rādīt katras pozicijas izcenojumu",
            )
          : t("estimate.offer.show_only_total", "Rādīt tikai gala summu")
      }
      icon={showOnlyTotal ? "fas fa-bookmark" : "far fa-bookmark"}
      variant="edit"
      onClick={() => onChange(!showOnlyTotal)}
      className={`h-7 w-7 shrink-0 ${
        showOnlyTotal ? "text-sky-600 hover:bg-sky-50 hover:text-sky-700" : ""
      } ${className}`.trim()}
    />
  );
}
