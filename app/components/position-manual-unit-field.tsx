type PositionManualUnitFieldProps = {
  id: string;
  enabled: boolean;
  unit: string;
  unitOptions: string[];
  onEnabledChange: (enabled: boolean) => void;
  onUnitChange: (unit: string) => void;
};

const selectClassName =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none";

export function PositionManualUnitField({
  id,
  enabled,
  unit,
  unitOptions,
  onEnabledChange,
  onUnitChange,
}: PositionManualUnitFieldProps) {
  const labelId = `${id}-label`;

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div
          id={labelId}
          className="flex min-w-0 items-center gap-2 text-sm text-zinc-700"
        >
          <i
            className="fas fa-ruler-combined shrink-0 text-xs text-sky-600"
            aria-hidden="true"
          />
          <span>Manuāli norādīta mērvienība</span>
        </div>
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={enabled}
          aria-labelledby={labelId}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
            enabled ? "bg-sky-600" : "bg-zinc-200"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled ? (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500">
            Mērvienība
          </span>
          <select
            value={unit}
            onChange={(event) => onUnitChange(event.target.value)}
            className={selectClassName}
            aria-label="Manuāli norādītā mērvienība"
          >
            {unitOptions.length === 0 ? (
              <option value="">Nav pieejamu mērvienību</option>
            ) : (
              unitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))
            )}
          </select>
        </label>
      ) : null}
    </div>
  );
}
