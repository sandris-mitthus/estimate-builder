import {
  POSITION_COST_TYPE_ICONS,
  POSITION_COST_TYPE_LABELS,
  type PositionCostType,
} from "@/app/lib/positions/position-cost-type";

type PositionCostTypeDisplayProps = {
  costType: PositionCostType;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
};

export function PositionCostTypeDisplay({
  costType,
  showLabel = true,
  className = "",
  iconClassName = "text-xs",
}: PositionCostTypeDisplayProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <i
        className={`${POSITION_COST_TYPE_ICONS[costType]} ${iconClassName}`.trim()}
        aria-hidden="true"
      />
      {showLabel ? (
        <span>{POSITION_COST_TYPE_LABELS[costType]}</span>
      ) : null}
    </span>
  );
}
