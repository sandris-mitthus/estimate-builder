"use client";

import { useTranslations } from "@/app/components/translations-provider";

type PositionVariableQuantityFieldProps = {
  id: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function PositionVariableQuantityField({
  id,
  enabled,
  onChange,
}: PositionVariableQuantityFieldProps) {
  const { t } = useTranslations();
  const labelId = `${id}-label`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <div id={labelId} className="flex min-w-0 items-center gap-2 text-sm text-zinc-700">
        <i className="fas fa-random shrink-0 text-xs text-violet-600" aria-hidden="true" />
        <span>{t("estimate.quantity.individual_title", "Individuāls apjoms katram projektam")}</span>
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={enabled}
        aria-labelledby={labelId}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          enabled ? "bg-violet-600" : "bg-zinc-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
