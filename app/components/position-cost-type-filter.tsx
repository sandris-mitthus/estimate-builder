import {
  CATALOG_POSITION_COST_TYPE_OPTIONS,
  type CatalogPositionCostType,
} from "@/app/lib/positions/position-cost-type";
import type { PositionCostTypeFilter } from "@/app/lib/positions/filter-positions";

type PositionCostTypeFilterProps = {
  id: string;
  value: PositionCostTypeFilter;
  onChange: (value: PositionCostTypeFilter) => void;
};

const FILTER_OPTIONS: {
  value: PositionCostTypeFilter;
  label: string;
  icon: string;
}[] = [
  { value: "all", label: "Visi", icon: "fas fa-list" },
  ...CATALOG_POSITION_COST_TYPE_OPTIONS.map((option) => ({
    value: option.value as CatalogPositionCostType,
    label: option.label,
    icon: option.icon,
  })),
];

export function PositionCostTypeFilter({
  id,
  value,
  onChange,
}: PositionCostTypeFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filtrēt pēc veida"
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
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
