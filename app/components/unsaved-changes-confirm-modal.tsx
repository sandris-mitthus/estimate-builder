"use client";

import { useId, useRef, type MouseEvent } from "react";
import { useTranslations } from "@/app/components/translations-provider";

const overlayClassName =
  "fixed inset-0 z-[60] flex items-center justify-center p-4";

const backdropClassName = "absolute inset-0 bg-zinc-900/50";

const panelClassName =
  "relative max-h-[calc(100%-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl";

type UnsavedChangesConfirmModalProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function UnsavedChangesConfirmModal({
  open,
  onStay,
  onLeave,
}: UnsavedChangesConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { languageCode, t } = useTranslations();
  const isEnglish = languageCode === "en";

  if (!open) {
    return null;
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (panelRef.current?.contains(event.target as Node)) {
      return;
    }

    onStay();
  }

  return (
    <div
      className={overlayClassName}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onMouseDown={handleBackdropClick}
    >
      <div className={backdropClassName} aria-hidden="true" />
      <div ref={panelRef} className={panelClassName}>
        <div className="p-6">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
            {t(
              "unsaved_changes.title",
              isEnglish ? "Leave without saving?" : "Doties prom nesaglabājot?",
            )}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm text-zinc-600">
            {t(
              "unsaved_changes.description",
              isEnglish
                ? "Are you sure you want to leave without saving? Unsaved changes will be lost!"
                : "Vai tiešām vēlies doties prom nesaglabājot? Visi dati tiks pazaudēti, ja netiks saglabāts!",
            )}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onStay}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              {t(
                "unsaved_changes.stay",
                isEnglish ? "Keep editing" : "Turpināt rediģēt",
              )}
            </button>
            <button
              type="button"
              onClick={onLeave}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              {t("unsaved_changes.leave", isEnglish ? "Leave" : "Doties prom")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
