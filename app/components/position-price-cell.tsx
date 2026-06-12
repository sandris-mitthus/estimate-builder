"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  hasSupplierTooltipContent,
  PositionSupplierTooltip,
} from "@/app/components/position-supplier-tooltip";
import { formatAmount } from "@/app/lib/estimates/calculate-line";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import type { CurrencyCode } from "@/app/lib/settings/currencies";

export function PositionPriceCell({
  position,
  currency,
}: {
  position: PositionPriceSummary;
  currency: CurrencyCode;
}) {
  const anchorRef = useRef<HTMLParagraphElement>(null);
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const showTooltip = hasSupplierTooltipContent(position);

  useLayoutEffect(() => {
    if (!hovered || !showTooltip) {
      setAnchorRect(null);
      return;
    }

    function updateRect() {
      setAnchorRect(anchorRef.current?.getBoundingClientRect() ?? null);
    }

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [hovered, showTooltip]);

  if (position.unitPrice === undefined) {
    return (
      <span className="cursor-default text-zinc-400">
        {`- ${currency} / ${position.unit}`}
      </span>
    );
  }

  const updatedLabel = position.unitPriceUpdatedAt
    ? formatDisplayDateDdMmYy(position.unitPriceUpdatedAt)
    : null;

  const tooltip =
    hovered && showTooltip && anchorRect
      ? createPortal(
          <PositionSupplierTooltip
            position={position}
            anchorRect={anchorRect}
          />,
          document.body,
        )
      : null;

  return (
    <>
      <div className="inline-block">
        <p
          ref={anchorRef}
          className={`text-zinc-900 ${showTooltip ? "cursor-help" : "cursor-default"}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {`${formatAmount(position.unitPrice)} ${currency} / ${position.unit}`}
        </p>
        {updatedLabel ? (
          <p className="mt-0.5 cursor-default text-xs text-zinc-400">
            {updatedLabel}
          </p>
        ) : null}
      </div>
      {tooltip}
    </>
  );
}
