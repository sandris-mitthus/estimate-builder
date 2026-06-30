"use client";

import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import type { ToolSummary } from "@/app/lib/tools/types";

type ToolHistoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolSummary;
};

export function ToolHistoryModal({
  open,
  onOpenChange,
  tool,
}: ToolHistoryModalProps) {
  const { t } = useTranslations();

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("tools.history.title", "Instrumenta vēsture")}
      description={`${tool.toolNumber} — ${tool.name}`}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      {tool.assignmentHistory.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5">
                  {t("common.date", "Datums")}
                </th>
                <th className="px-3 py-2.5">
                  {t("tools.assign_worker.search_label", "Darbinieks")}
                </th>
              </tr>
            </thead>
            <tbody>
              {tool.assignmentHistory.map((entry) => (
                <tr key={entry.id} className="border-b border-zinc-100 last:border-b-0">
                  <td className="px-3 py-2.5 text-zinc-600">
                    {formatDisplayDateDdMmYy(entry.assignedAt) || "—"}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-zinc-900">
                    {entry.workerName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          {t("tools.history.empty", "Instrumentam vēl nav piesaistes vēstures.")}
        </p>
      )}
    </AppModal>
  );
}
