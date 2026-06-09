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

const confirmOverlayClassName =
  "fixed inset-0 z-[60] flex items-center justify-center p-4";

const backdropClassName = "absolute inset-0 bg-zinc-900/40";

const confirmBackdropClassName = "absolute inset-0 bg-zinc-900/50";

const panelClassName =
  "relative max-h-[calc(100%-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl";

type AppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  blocking?: boolean;
};

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  blocking = false,
}: AppModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);

  const closeDirectly = useCallback(() => {
    if (blocking) return;
    setConfirmExitOpen(false);
    onOpenChange(false);
  }, [blocking, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setConfirmExitOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || blocking) return;

      if (confirmExitOpen) {
        event.preventDefault();
        setConfirmExitOpen(false);
        return;
      }

      event.preventDefault();
      closeDirectly();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, blocking, confirmExitOpen, closeDirectly]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function requestBackdropConfirm() {
    if (blocking || confirmExitOpen) return;
    setConfirmExitOpen(true);
  }

  function confirmExit() {
    closeDirectly();
  }

  function cancelExit() {
    setConfirmExitOpen(false);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || blocking) return;
    requestBackdropConfirm();
  }

  function handleConfirmBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    cancelExit();
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className={overlayClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={handleBackdropClick}
      >
        <div className={backdropClassName} aria-hidden="true" />
        <div
          className={panelClassName}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm text-zinc-500">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeDirectly}
                disabled={blocking}
                aria-label="Aizvērt"
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>

      {confirmExitOpen ? (
        <div
          className={confirmOverlayClassName}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-exit-title"
          onMouseDown={handleConfirmBackdropClick}
        >
          <div className={confirmBackdropClassName} aria-hidden="true" />
          <div
            className={`${panelClassName} max-w-sm`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="p-6">
              <h2 id="confirm-exit-title" className="text-lg font-semibold text-zinc-900">
                Izbeigt darbību?
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Vai vēlaties izbeigt šo darbību?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelExit}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Turpināt
                </button>
                <button
                  type="button"
                  onClick={confirmExit}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Izbeigt
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
