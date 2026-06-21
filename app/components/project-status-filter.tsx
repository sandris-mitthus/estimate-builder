"use client";

import type { ProjectArchiveFilter } from "@/app/lib/projects/filter-projects";
import { useTranslations } from "@/app/components/translations-provider";

type ProjectStatusFilterProps = {
  id: string;
  value: ProjectArchiveFilter;
  onChange: (value: ProjectArchiveFilter) => void;
};

const FILTER_OPTIONS: {
  value: ProjectArchiveFilter;
  labelKey: string;
  fallbackLabel: string;
  icon: string;
}[] = [
  { value: "all", labelKey: "filters.all", fallbackLabel: "Visi", icon: "fas fa-list" },
  { value: "active", labelKey: "filters.active", fallbackLabel: "Aktīvie", icon: "fas fa-circle" },
  { value: "in_progress", labelKey: "filters.in_progress", fallbackLabel: "Procesā", icon: "fas fa-check" },
  { value: "completed", labelKey: "filters.completed", fallbackLabel: "Pabeigtie", icon: "fas fa-check-double" },
  { value: "rejected", labelKey: "filters.rejected", fallbackLabel: "Noraidītie", icon: "fas fa-times" },
];

export function ProjectStatusFilter({
  id,
  value,
  onChange,
}: ProjectStatusFilterProps) {
  const { t } = useTranslations();

  return (
    <div
      role="radiogroup"
      aria-label={t("filters.status.aria", "Filtrēt pēc statusa")}
      className="inline-flex overflow-hidden rounded-lg border border-zinc-200 bg-white text-xs"
    >
      {FILTER_OPTIONS.map((option, index) => {
        const isSelected = value === option.value;
        const inputId = `${id}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={`flex cursor-pointer items-center justify-center border-zinc-200 px-2.5 py-1.5 font-medium transition ${
              index > 0 ? "border-l" : ""
            } ${
              isSelected
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <input
              id={inputId}
              type="radio"
              name={id}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <i className={`${option.icon} text-[10px]`} aria-hidden="true" />
              {t(option.labelKey, option.fallbackLabel)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
