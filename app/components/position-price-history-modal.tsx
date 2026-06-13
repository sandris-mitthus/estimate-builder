"use client";

import { useEffect, useState } from "react";

import { getPositionPriceHistoryAction } from "@/app/(protected)/positions/actions";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { formatAmount } from "@/app/lib/estimates/calculate-line";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import type {
  PositionPriceHistoryEntry,
  PositionPriceSummary,
} from "@/app/lib/positions/types";
import type { CurrencyCode } from "@/app/lib/settings/currencies";
import { formatDisplayPhone } from "@/app/lib/validation/contact-fields";

type PositionPriceHistoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: PositionPriceSummary;
  currency: CurrencyCode;
};

function SupplierHistoryCell({ entry }: { entry: PositionPriceHistoryEntry }) {
  const storeName = entry.supplierName?.trim();
  const contactName = entry.supplierContactName?.trim();
  const email = entry.supplierEmail?.trim();
  const phone = entry.supplierPhone?.trim();

  if (!storeName && !contactName && !email && !phone) {
    return <span className="text-zinc-400">—</span>;
  }

  return (
    <div className="space-y-1.5">
      {storeName || contactName ? (
        <p className="text-zinc-800">
          {storeName ? (
            <span className="font-medium">{storeName}</span>
          ) : null}
          {storeName && contactName ? (
            <span className="text-zinc-400"> · </span>
          ) : null}
          {contactName ? <span className="text-zinc-700">{contactName}</span> : null}
        </p>
      ) : null}
      {phone || email ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-600">
          {phone ? (
            <p className="flex items-center gap-2">
              <i
                className="fas fa-phone w-3.5 shrink-0 text-center text-[11px] text-zinc-400"
                aria-hidden="true"
              />
              <span>{formatDisplayPhone(phone)}</span>
            </p>
          ) : null}
          {email ? (
            <p className="flex items-center gap-2">
              <i
                className="fas fa-envelope w-3.5 shrink-0 text-center text-[11px] text-zinc-400"
                aria-hidden="true"
              />
              <span>{email}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PositionPriceHistoryModal({
  open,
  onOpenChange,
  position,
  currency,
}: PositionPriceHistoryModalProps) {
  const [entries, setEntries] = useState<PositionPriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setLoading(true);

      try {
        const result = await getPositionPriceHistoryAction(position.id);
        if (!cancelled) {
          if (!Array.isArray(result)) return;
          setEntries(result);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [open, position.id]);

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Vēsture"
      description={`${position.name} · ${position.unit}`}
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-zinc-500">Ielādē vēsturi…</p>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          Nav saglabātu cenu izmaiņu.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                <th className="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-left">
                  Datums
                </th>
                <th className="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-left">
                  Cena
                </th>
                <th className="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-left">
                  Veikals
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const previousPrice = entries[index + 1]?.unitPrice;

                return (
                  <tr
                    key={entry.id}
                    className="border-b border-zinc-200 last:border-b-0 odd:bg-white even:bg-zinc-50/80"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                      {formatDisplayDateDdMmYy(entry.recordedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {`${formatAmount(entry.unitPrice)} ${currency} / ${position.unit}`}
                      </p>
                      {previousPrice !== undefined &&
                      previousPrice !== entry.unitPrice ? (
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {`No ${formatAmount(previousPrice)} ${currency}`}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <SupplierHistoryCell entry={entry} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Aizvērt
        </button>
      </div>
    </AppModal>
  );
}
