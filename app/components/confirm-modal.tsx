"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "@/app/components/translations-provider";

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
  cancelLabel,
  onConfirm,
  confirmVariant = "default",
  blocking = false,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const onConfirmRef = useRef(onConfirm);
  const blockingRef = useRef(blocking);
  const { t } = useTranslations();
  const resolvedCancelLabel = cancelLabel ?? t("actions.cancel", "Atcelt");

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  });
  useEffect(() => {
    blockingRef.current = blocking;
  });

  const close = useCallback(() => {
    if (blockingRef.current) return;
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (blockingRef.current) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Enter" || event.shiftKey) return;

      const target = event.target;
      if (
        target instanceof HTMLButtonElement &&
        panelRef.current?.contains(target)
      ) {
        return;
      }

      event.preventDefault();
      onConfirmRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;

    const frameId = requestAnimationFrame(() => {
      confirmButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (blocking) return;
    if (panelRef.current?.contains(event.target as Node)) return;
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
      <div ref={panelRef} className={panelClassName}>
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
              {resolvedCancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
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
