"use client";

import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayPhone } from "@/app/lib/validation/contact-fields";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type SupplierTooltipRow = {
  key: string;
  iconClass: string;
  value: string;
};

function buildSupplierTooltipRows(
  position: PositionPriceSummary,
): SupplierTooltipRow[] {
  const rows: SupplierTooltipRow[] = [];

  if (position.supplierName?.trim()) {
    rows.push({
      key: "store",
      iconClass: "fas fa-store",
      value: position.supplierName.trim(),
    });
  }

  if (position.supplierContactName?.trim()) {
    rows.push({
      key: "contact",
      iconClass: "fas fa-user",
      value: position.supplierContactName.trim(),
    });
  }

  if (position.supplierEmail?.trim()) {
    rows.push({
      key: "email",
      iconClass: "fas fa-envelope",
      value: position.supplierEmail.trim(),
    });
  }

  if (position.supplierPhone?.trim()) {
    rows.push({
      key: "phone",
      iconClass: "fas fa-phone",
      value: formatDisplayPhone(position.supplierPhone),
    });
  }

  return rows;
}

export function hasSupplierTooltipContent(position: PositionPriceSummary): boolean {
  return buildSupplierTooltipRows(position).length > 0;
}

type PositionSupplierTooltipProps = {
  position: PositionPriceSummary;
  anchorRect: DOMRect;
};

export function PositionSupplierTooltip({
  position,
  anchorRect,
}: PositionSupplierTooltipProps) {
  const { t } = useTranslations();
  const rows = buildSupplierTooltipRows(position);
  if (rows.length === 0) return null;

  const arrowLeft = Math.min(Math.max(anchorRect.width / 2, 20), 240);

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[70] max-w-[300px] cursor-default"
      style={{
        top: anchorRect.top - 12,
        left: anchorRect.left,
        transform: "translateY(-100%)",
      }}
    >
      <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white/95 shadow-[0_12px_40px_-12px_rgba(24,24,27,0.28)] ring-1 ring-zinc-900/5 backdrop-blur-sm">
        <div className="border-b border-zinc-100 bg-zinc-50/80 px-3.5 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t("positions.supplier.store", "Veikals")}
          </p>
        </div>
        <div className="divide-y divide-zinc-100/80 px-3.5 py-1">
          {rows.map((row) => (
            <div key={row.key} className="flex items-start gap-2.5 py-2.5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] text-zinc-500">
                <i className={row.iconClass} aria-hidden="true" />
              </span>
              <p className="min-w-0 pt-0.5 text-sm leading-snug text-zinc-800">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div
        className="absolute bottom-0 size-2.5 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-zinc-200/90 bg-white"
        style={{ left: arrowLeft }}
        aria-hidden="true"
      />
    </div>
  );
}
