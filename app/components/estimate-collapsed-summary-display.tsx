import type { CollapsedSectionSummaryParts } from "@/app/lib/estimate-positions/collapsed-sections-cookie";

export function collapsedSummaryPartsToLabel(
  parts: CollapsedSectionSummaryParts,
): string {
  return [parts.subcategoryLine, parts.positionLine, parts.fallbackLine]
    .filter(Boolean)
    .join("\n");
}

export function EstimateCollapsedSummaryDisplay({
  parts,
  className = "",
}: {
  parts: CollapsedSectionSummaryParts;
  className?: string;
}) {
  const hasContent = Boolean(
    parts.subcategoryLine ?? parts.positionLine ?? parts.fallbackLine,
  );

  if (!hasContent) {
    return null;
  }

  return (
    <div className={`flex justify-end ${className}`.trim()}>
      <div className="flex w-fit flex-col gap-0.5 px-0.5 text-left">
        {parts.subcategoryLine ? (
          <span className="block truncate text-[10px] font-normal leading-tight text-zinc-500">
            {parts.subcategoryLine}
          </span>
        ) : null}
        {parts.positionLine ? (
          <span className="block truncate text-[10px] font-normal leading-tight text-zinc-500">
            {parts.positionLine}
          </span>
        ) : null}
        {parts.fallbackLine ? (
          <span className="block truncate text-[10px] font-normal leading-tight text-zinc-500">
            {parts.fallbackLine}
          </span>
        ) : null}
      </div>
    </div>
  );
}
