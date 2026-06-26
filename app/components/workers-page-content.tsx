"use client";

import { useMemo, useState } from "react";
import { AddWorkerButton } from "@/app/components/add-worker-button";
import { SectionPage } from "@/app/components/section-page";
import { WorkerRowActions } from "@/app/components/worker-row-actions";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import type { WorkerSummary } from "@/app/lib/workers/types";
import { formatWorkerName } from "@/app/lib/workers/types";

type WorkersPageContentProps = {
  initialWorkers: WorkerSummary[];
};

export function WorkersPageContent({ initialWorkers }: WorkersPageContentProps) {
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");

  const visibleWorkers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return initialWorkers;

    return initialWorkers.filter((worker) => {
      const haystack = [
        formatWorkerName(worker),
        worker.phone,
        worker.phoneCallingCode,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [initialWorkers, searchQuery]);

  return (
    <SectionPage
      title={t("nav.workers", "Darbinieki")}
      subtitle={t(
        "workers.page.subtitle",
        "Definē darbiniekus ar vārdu, uzvārdu, telefonu un foto.",
      )}
      actions={<AddWorkerButton />}
    >
      <div className="space-y-3">
        <label htmlFor="workers-search" className="relative block">
          <span className="sr-only">{t("workers.search.placeholder", "Meklēt darbiniekus…")}</span>
          <i
            className="fas fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
            aria-hidden="true"
          />
          <input
            id="workers-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("workers.search.placeholder", "Meklēt darbiniekus…")}
            className={`${formInputFullWidthClass} ${formInputClassName()} pl-9`}
          />
        </label>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {visibleWorkers.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              {searchQuery.trim()
                ? t("common.no_search_results", "Nekas netika atrasts.")
                : t("workers.empty", "Vēl nav pievienots neviens darbinieks.")}
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-3">{t("workers.field.photo", "Foto")}</th>
                  <th className="px-3 py-3">{t("common.name", "Nosaukums")}</th>
                  <th className="px-3 py-3">{t("workers.field.phone", "Telefons")}</th>
                  <th className="px-3 py-3 text-right">{t("common.actions", "Darbības")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleWorkers.map((worker) => (
                  <tr key={worker.id} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-3 py-3">
                      <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-50">
                        {worker.photoUrl ? (
                          <img
                            src={worker.photoUrl}
                            alt={formatWorkerName(worker)}
                            className="size-full object-cover"
                          />
                        ) : (
                          <i className="fas fa-user text-zinc-300" aria-hidden="true" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-zinc-900">
                      {formatWorkerName(worker)}
                    </td>
                    <td className="px-3 py-3 text-zinc-600">
                      {worker.phone
                        ? `${worker.phoneCallingCode} ${worker.phone}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <WorkerRowActions worker={worker} />
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
