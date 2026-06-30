"use client";

import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { formatMoney } from "@/app/lib/estimates/format-money";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import type { ToolSummary } from "@/app/lib/tools/types";
import type { WorkerSummary } from "@/app/lib/workers/types";
import { formatWorkerName } from "@/app/lib/workers/types";

type WorkerToolsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: WorkerSummary;
  tools: ToolSummary[];
};

export function WorkerToolsModal({
  open,
  onOpenChange,
  worker,
  tools,
}: WorkerToolsModalProps) {
  const { t } = useTranslations();

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("workers.tools.title", "Piesaistītie instrumenti")}
      description={formatWorkerName(worker)}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      {tools.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5">{t("tools.field.number", "Numurs")}</th>
                <th className="px-3 py-2.5">{t("tools.field.name", "Nosaukums")}</th>
                <th className="px-3 py-2.5">{t("tools.field.purchase_date", "Iegādes datums")}</th>
                <th className="px-3 py-2.5">{t("tools.field.price", "Cena")}</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.id} className="border-b border-zinc-100 last:border-b-0">
                  <td className="px-3 py-2.5 font-medium text-zinc-900">
                    {tool.toolNumber}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-900">{tool.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">
                    {tool.purchaseDate
                      ? formatDisplayDateDdMmYy(tool.purchaseDate)
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600">
                    {tool.price !== null ? formatMoney(tool.price) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          {t("workers.tools.empty", "Darbiniekam nav piesaistītu instrumentu.")}
        </p>
      )}
    </AppModal>
  );
}
