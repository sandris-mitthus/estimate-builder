"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

const overlayClassName =
  "fixed inset-0 z-50 flex items-center justify-center p-4";

const backdropClassName = "absolute inset-0 bg-zinc-900/50";

const panelClassName =
  "relative max-h-[calc(100%-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl";

type ConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  confirmVariant?: "default" | "danger";
  blocking?: boolean;
};

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Atcelt",
  onConfirm,
  confirmVariant = "default",
  blocking = false,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  const close = useCallback(() => {
    if (blocking) return;
    onOpenChange(false);
  }, [blocking, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || blocking) return;
      event.preventDefault();
      close();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, blocking, close]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || blocking) return;
    close();
  }

  if (!open) {
    return null;
  }

  const confirmClassName =
    confirmVariant === "danger"
      ? "rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60";

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
      <div
        className={panelClassName}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="p-6">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
            {title}
          </h2>
          <div id={descriptionId} className="mt-2 text-sm text-zinc-600">
            {description}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={close}
              disabled={blocking}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={blocking}
              className={confirmClassName}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
