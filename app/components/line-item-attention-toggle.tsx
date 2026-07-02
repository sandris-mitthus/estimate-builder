"use client";

import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

type LineItemAttentionToggleProps = {
  id: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
};

export const estimateAttentionRowClassName =
  "ring-2 ring-inset ring-red-400 hover:bg-red-50/30";

export function EstimateAttentionIcon({ className = "" }: { className?: string }) {
  return (
    <i
      className={`fas fa-exclamation shrink-0 text-xs text-red-500 ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export function LineItemAttentionToggle({
  id,
  enabled,
  onChange,
  className = "",
}: LineItemAttentionToggleProps) {
  const { t } = useTranslations();
  const active = enabled === true;

  return (
    <Tooltip
      label={
        active
          ? t(
              "estimate.attention.enabled",
              "Īpaša uzmanība ieslēgta (piem. ierobežots budžets)",
            )
          : t(
              "estimate.attention.disabled",
              "Atzīmēt pozīciju ar īpašu uzmanību",
            )
      }
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={active}
        aria-label={
          active
            ? t("estimate.attention.disable", "Izslēgt īpašo uzmanību")
            : t("estimate.attention.enable", "Ieslēgt īpašo uzmanību")
        }
        onClick={() => onChange(!active)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
          active ? "bg-red-500" : "bg-zinc-200"
        } ${className}`.trim()}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
            active ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </Tooltip>
  );
}
