"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { updateTimelineEntryAction } from "@/app/(protected)/timeline/actions";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { SectionPage } from "@/app/components/section-page";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { TimelineEntry } from "@/app/lib/timeline/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_SHORT_LABELS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "mai",
  "jūn",
  "jūl",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
] as const;

function parseIsoDate(value: string): number {
  return new Date(`${value}T00:00:00`).getTime();
}

function formatMonthYearLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const month = MONTH_SHORT_LABELS[date.getMonth()] ?? "";
  const year = String(date.getFullYear()).slice(-2);
  return `${month} ${year}`;
}

function buildMonthLabels(minDate: number, maxDate: number): { label: string; leftPercent: number }[] {
  const labels: { label: string; leftPercent: number }[] = [];
  const range = Math.max(maxDate - minDate, DAY_MS);
  const cursor = new Date(minDate);
  cursor.setDate(1);

  while (cursor.getTime() <= maxDate) {
    const position = ((cursor.getTime() - minDate) / range) * 100;
    labels.push({
      label: formatMonthYearLabel(cursor.getTime()),
      leftPercent: Math.min(100, Math.max(0, position)),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return labels;
}

type TimelineEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: TimelineEntry;
};

function TimelineEditModal({ open, onOpenChange, entry }: TimelineEditModalProps) {
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [startDate, setStartDate] = useState(entry.startDate);
  const [endDate, setEndDate] = useState(entry.endDate);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setStartDate(entry.startDate);
    setEndDate(entry.endDate);
    setError(null);
  }, [open, entry]);

  const isDirty =
    startDate !== entry.startDate || endDate !== entry.endDate;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateTimelineEntryAction({
        id: entry.id,
        startDate,
        endDate,
      });

      if (!result.ok) {
        setError(translateActionError(t, result));
        return;
      }

      onOpenChange(false);
      showFeedback({
        type: "success",
        text: t("timeline.feedback.updated", "Laika grafiks saglabāts."),
      });
      router.refresh();
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("timeline.modal.edit_title", "Labot projekta termiņus")}
      description={entry.projectName}
      blocking={isPending}
      dirty={isDirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="timeline-start-date" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("timeline.field.start_date", "Sākuma datums")}
            </label>
            <input
              id="timeline-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={`${formInputClassName()} ${formInputFullWidthClass}`}
            />
          </div>
          <div>
            <label htmlFor="timeline-end-date" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("timeline.field.end_date", "Beigu datums")}
            </label>
            <input
              id="timeline-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={`${formInputClassName()} ${formInputFullWidthClass}`}
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <ModalFormActions
          onCancel={() => onOpenChange(false)}
          cancelDisabled={isPending}
        >
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}

type TimelineRowProps = {
  entry: TimelineEntry;
  minDate: number;
  maxDate: number;
};

function TimelineRow({ entry, minDate, maxDate }: TimelineRowProps) {
  const canManage = useActionPermission("timeline.manage");
  const { t } = useTranslations();
  const [editOpen, setEditOpen] = useState(false);

  const range = Math.max(maxDate - minDate, DAY_MS);
  const start = parseIsoDate(entry.startDate);
  const end = parseIsoDate(entry.endDate);
  const leftPercent = ((start - minDate) / range) * 100;
  const widthPercent = Math.max(((end - start) / range) * 100, 1.5);

  return (
    <>
      <div className="grid grid-cols-[minmax(180px,240px)_1fr_auto] items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0">
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900">{entry.projectName}</p>
          {entry.projectAddress ? (
            <p className="truncate text-xs text-zinc-500">{entry.projectAddress}</p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">
            {formatDisplayDateDdMmYy(entry.startDate)} — {formatDisplayDateDdMmYy(entry.endDate)}
          </p>
        </div>

        <div className="relative h-8 rounded-lg bg-zinc-100">
          <div
            className="absolute top-1/2 h-5 -translate-y-1/2 rounded-md bg-red-600 shadow-sm"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
            }}
            title={t("timeline.legend.approved", "Apstiprināts projekts")}
          />
        </div>

        <div className="flex justify-end">
          {canManage ? (
            <IconActionButton
              label={t("timeline.actions.edit", "Labot termiņus")}
              icon="fas fa-pen"
              variant="edit"
              onClick={() => setEditOpen(true)}
            />
          ) : null}
        </div>
      </div>

      {canManage ? (
        <TimelineEditModal
          key={entry.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          entry={entry}
        />
      ) : null}
    </>
  );
}

type TimelinePageContentProps = {
  initialEntries: TimelineEntry[];
};

export function TimelinePageContent({ initialEntries }: TimelinePageContentProps) {
  const { t } = useTranslations();

  const { minDate, maxDate, monthLabels } = useMemo(() => {
    if (initialEntries.length === 0) {
      const today = parseIsoDate(new Date().toISOString().slice(0, 10));
      return {
        minDate: today,
        maxDate: today + 30 * DAY_MS,
        monthLabels: [] as { label: string; leftPercent: number }[],
      };
    }

    const starts = initialEntries.map((entry) => parseIsoDate(entry.startDate));
    const ends = initialEntries.map((entry) => parseIsoDate(entry.endDate));
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const paddedMin = min - 7 * DAY_MS;
    const paddedMax = max + 7 * DAY_MS;

    return {
      minDate: paddedMin,
      maxDate: paddedMax,
      monthLabels: buildMonthLabels(paddedMin, paddedMax),
    };
  }, [initialEntries]);

  return (
    <SectionPage
      title={t("nav.timeline", "Termiņu grafiks")}
      subtitle={t(
        "timeline.page.subtitle",
        "Apstiprinātie projekti parādās sarkanā laika grafikā.",
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="inline-block size-3 rounded-sm bg-red-600" aria-hidden="true" />
          {t("timeline.legend.approved", "Apstiprināts projekts")}
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {initialEntries.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              {t(
                "timeline.empty",
                "Nav apstiprinātu projektu. Kad projekts tiks apstiprināts, tas parādīsies šeit.",
              )}
            </p>
          ) : (
            <>
              <div className="relative h-8 border-b border-zinc-100 bg-zinc-50/80">
                {monthLabels.map((month) => (
                  <span
                    key={`${month.label}-${month.leftPercent}`}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-medium uppercase tracking-wide text-zinc-400"
                    style={{ left: `${month.leftPercent}%` }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>

              {initialEntries.map((entry) => (
                <TimelineRow
                  key={entry.id}
                  entry={entry}
                  minDate={minDate}
                  maxDate={maxDate}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </SectionPage>
  );
}
