import {
  POSITION_COST_TYPE_OPTIONS,
  type PositionCostType,
} from "@/app/lib/positions/position-cost-type";

type PositionCostTypeFieldProps = {
  id: string;
  value: PositionCostType;
  onChange: (value: PositionCostType) => void;
  error?: string;
};

export function PositionCostTypeField({
  id,
  value,
  onChange,
  error,
}: PositionCostTypeFieldProps) {
  return (
    <fieldset>
      <legend
        id={`${id}-legend`}
        className="mb-1.5 block text-sm font-medium text-zinc-700"
      >
        Izmaksu veids
      </legend>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-legend`}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`flex overflow-hidden rounded-lg border bg-white ${
          error ? "border-red-300" : "border-zinc-200"
        }`}
      >
        {POSITION_COST_TYPE_OPTIONS.map((option, index) => {
          const isSelected = value === option.value;
          const inputId = `${id}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={`flex flex-1 cursor-pointer items-center justify-center border-zinc-200 px-3 py-2.5 text-center text-sm font-medium transition ${
                index > 0 ? "border-l" : ""
              } ${
                isSelected
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50"
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
              <span className="inline-flex items-center gap-2">
                <i className={`${option.icon} text-xs`} aria-hidden="true" />
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
