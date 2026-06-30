"use client";

import { useMemo, useState, useTransition } from "react";
import { assignToolWorkerAction } from "@/app/(protected)/tools/actions";
import { AppModal } from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type {
  ToolAssignmentHistoryEntry,
  ToolSummary,
} from "@/app/lib/tools/types";
import type { WorkerSummary } from "@/app/lib/workers/types";
import { formatWorkerName } from "@/app/lib/workers/types";

type ToolAssignWorkerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolSummary;
  workers: WorkerSummary[];
  onToolUpdated: (tool: ToolSummary) => void;
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function ToolAssignWorkerModal({
  open,
  onOpenChange,
  tool,
  workers,
  onToolUpdated,
}: ToolAssignWorkerModalProps) {
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [query, setQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [pendingWorkerId, setPendingWorkerId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredWorkers = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) return workers;

    return workers.filter((worker) =>
      formatWorkerName(worker).toLowerCase().includes(normalizedQuery),
    );
  }, [query, workers]);

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (!nextOpen) {
      setQuery("");
      setSuggestionsOpen(false);
      setPendingWorkerId(null);
    }
    onOpenChange(nextOpen);
  }

  function assignWorker(worker: WorkerSummary) {
    if (worker.id === tool.assignedWorkerId) {
      handleOpenChange(false);
      return;
    }

    const workerName = formatWorkerName(worker);
    const optimisticHistoryEntry: ToolAssignmentHistoryEntry = {
      id: `pending:${tool.id}:${worker.id}:${tool.assignmentHistory.length}`,
      toolId: tool.id,
      workerId: worker.id,
      workerName,
      assignedAt: "",
    };
    const optimisticTool: ToolSummary = {
      ...tool,
      assignedWorkerId: worker.id,
      assignedWorkerName: workerName,
      assignmentHistory: [optimisticHistoryEntry, ...tool.assignmentHistory],
    };

    setPendingWorkerId(worker.id);
    onToolUpdated(optimisticTool);
    handleOpenChange(false);

    startTransition(async () => {
      const result = await assignToolWorkerAction({
        toolId: tool.id,
        workerId: worker.id,
      });

      if (!result.ok) {
        onToolUpdated(tool);
        setPendingWorkerId(null);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      if (result.historyEntry) {
        onToolUpdated({
          ...optimisticTool,
          assignmentHistory: [
            result.historyEntry,
            ...optimisticTool.assignmentHistory.filter(
              (entry) => entry.id !== optimisticHistoryEntry.id,
            ),
          ],
        });
      }

      setPendingWorkerId(null);
      showFeedback({
        type: "success",
        text: t("tools.feedback.assigned_worker", "Instruments piesaistīts darbiniekam."),
      });
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [firstWorker] = filteredWorkers;
    if (!firstWorker || isPending) return;
    assignWorker(firstWorker);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title={t("tools.assign_worker.title", "Piesaistīt darbiniekam")}
      description={`${tool.toolNumber} — ${tool.name}`}
      blocking={false}
      dirty={query.trim().length > 0}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tool-worker-search" className="mb-1.5 block text-sm font-medium text-zinc-700">
            {t("tools.assign_worker.search_label", "Darbinieks")}
          </label>
          <input
            id="tool-worker-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder={t(
              "tools.assign_worker.search_placeholder",
              "Meklē pēc vārda vai uzvārda",
            )}
            autoComplete="off"
            role="combobox"
            aria-expanded={suggestionsOpen}
            aria-controls="tool-worker-search-results"
            aria-autocomplete="list"
            className={`${formInputClassName()} ${formInputFullWidthClass}`}
            autoFocus
          />

          {suggestionsOpen ? (
            <div
              id="tool-worker-search-results"
              role="listbox"
              className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-sm"
            >
              {filteredWorkers.length > 0 ? (
                filteredWorkers.map((worker) => {
                  const workerName = formatWorkerName(worker);
                  const isAssigned = worker.id === tool.assignedWorkerId;
                  const isWorkerPending = pendingWorkerId === worker.id;

                  return (
                    <button
                      key={worker.id}
                      type="button"
                      role="option"
                      aria-selected={isAssigned}
                      disabled={isPending}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => assignWorker(worker)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="font-medium text-zinc-900">{workerName}</span>
                      {isWorkerPending ? (
                        <i className="fas fa-spinner animate-spin text-xs text-zinc-400" aria-hidden="true" />
                      ) : isAssigned ? (
                        <span className="text-xs font-medium text-emerald-600">
                          {t("tools.assign_worker.current", "Piesaistīts")}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-3 text-sm text-zinc-500">
                  {workers.length === 0
                    ? t("tools.assign_worker.no_workers", "Nav pievienots neviens darbinieks.")
                    : t("common.no_search_results", "Nekas netika atrasts.")}
                </p>
              )}
            </div>
          ) : null}
        </div>

        <ModalFormActions
          onCancel={() => handleOpenChange(false)}
          cancelDisabled={false}
        >
          <button
            type="submit"
            disabled={filteredWorkers.length === 0}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("tools.assign_worker.assign_first", "Piesaistīt pirmo")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
