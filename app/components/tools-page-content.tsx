"use client";

import { useMemo, useState } from "react";
import { AddToolButton } from "@/app/components/add-tool-button";
import { SectionPage } from "@/app/components/section-page";
import { ToolRowActions } from "@/app/components/tool-row-actions";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { formatMoney } from "@/app/lib/estimates/format-money";
import type { ToolSummary } from "@/app/lib/tools/types";
import type { WorkerSummary } from "@/app/lib/workers/types";

type ToolsPageContentProps = {
  initialTools: ToolSummary[];
  workers: WorkerSummary[];
};

export function ToolsPageContent({ initialTools, workers }: ToolsPageContentProps) {
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");

  const visibleTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return initialTools;

    return initialTools.filter((tool) => {
      const haystack = [
        tool.toolNumber,
        tool.name,
        tool.assignedWorkerName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [initialTools, searchQuery]);

  return (
    <SectionPage
      title={t("nav.tools", "Instrumenti")}
      subtitle={t(
        "tools.page.subtitle",
        "Reģistrē instrumentus, cenas un piesaisti tos darbiniekiem.",
      )}
      actions={<AddToolButton workers={workers} />}
    >
      <div className="space-y-3">
        <label htmlFor="tools-search" className="relative block">
          <span className="sr-only">{t("tools.search.placeholder", "Meklēt instrumentus…")}</span>
          <i
            className="fas fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
            aria-hidden="true"
          />
          <input
            id="tools-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("tools.search.placeholder", "Meklēt instrumentus…")}
            className={`${formInputFullWidthClass} ${formInputClassName()} pl-9`}
          />
        </label>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {visibleTools.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              {searchQuery.trim()
                ? t("common.no_search_results", "Nekas netika atrasts.")
                : t("tools.empty", "Vēl nav pievienots neviens instruments.")}
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-3">{t("tools.field.number", "Numurs")}</th>
                  <th className="px-3 py-3">{t("tools.field.name", "Nosaukums")}</th>
                  <th className="px-3 py-3">{t("tools.field.purchase_date", "Iegādes datums")}</th>
                  <th className="px-3 py-3">{t("tools.field.price", "Cena")}</th>
                  <th className="px-3 py-3">{t("tools.column.worker", "Darbinieks")}</th>
                  <th className="px-3 py-3 text-right">{t("common.actions", "Darbības")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleTools.map((tool) => (
                  <tr key={tool.id} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-3 py-3 font-medium text-zinc-900">{tool.toolNumber}</td>
                    <td className="px-3 py-3 text-zinc-900">{tool.name}</td>
                    <td className="px-3 py-3 text-zinc-600">
                      {tool.purchaseDate
                        ? formatDisplayDateDdMmYy(tool.purchaseDate)
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-zinc-600">
                      {tool.price !== null ? (
                        <span>
                          {formatMoney(tool.price)}
                          <span className="ml-1 text-xs text-zinc-400">
                            (
                            {tool.priceType === "amortization"
                              ? t("tools.price_type.amortization", "Amortizācijas")
                              : t("tools.price_type.purchase", "Pirkšanas")}
                            )
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-zinc-600">
                      {tool.assignedWorkerName ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <ToolRowActions tool={tool} workers={workers} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SectionPage>
  );
}
