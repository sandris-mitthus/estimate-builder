"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ModalStackProvider,
  useModalStack,
} from "@/app/components/modal-stack-context";
import { useTranslations } from "@/app/components/translations-provider";

const overlayBaseClassName =
  "fixed inset-0 flex items-center justify-center p-4";

const confirmOverlayBaseClassName =
  "fixed inset-0 flex items-center justify-center p-4";

const backdropClassName = "absolute inset-0 bg-zinc-900/40";

const confirmBackdropClassName = "absolute inset-0 bg-zinc-900/50";

const panelBaseClassName =
  "relative max-h-[calc(100%-2rem)] w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl";

const defaultPanelMaxWidthClassName = "max-w-md";

/** Portaled dropdowns (unit hints, …) must not count as backdrop clicks. */
function isBackdropDismissTarget(target: Node, panel: HTMLElement | null): boolean {
  if (panel?.contains(target)) {
    return false;
  }

  if (target instanceof Element && target.closest("[data-app-modal-ignore-backdrop]")) {
    return false;
  }

  return true;
}

/** 20% wider than default `max-w-md` (28rem → 33.6rem). */
export const appModalWidePanelMaxWidthClassName = "max-w-[33.6rem]";

/** 40% wider than default `max-w-md` (28rem → 40.04rem). */
export const appModalExtraWidePanelMaxWidthClassName = "max-w-[40.04rem]";

type AppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  blocking?: boolean;
  /** When false, backdrop click closes without confirm exit dialog. */
  dirty?: boolean;
  panelMaxWidthClassName?: string;
};

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  blocking = false,
  dirty = false,
  panelMaxWidthClassName = defaultPanelMaxWidthClassName,
}: AppModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmPanelRef = useRef<HTMLDivElement>(null);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [childNestedOpenCount, setChildNestedOpenCount] = useState(0);
  const { t } = useTranslations();
  const parentStack = useModalStack();
  const overlayZIndex = 50 + parentStack.depth * 10;
  const confirmZIndex = overlayZIndex + 10;
  const parentNotifyNestedOpenRef = useRef(parentStack.notifyNestedOpen);
  parentNotifyNestedOpenRef.current = parentStack.notifyNestedOpen;

  const notifyChildNestedOpen = useCallback((delta: number) => {
    setChildNestedOpenCount((current) => Math.max(0, current + delta));
    parentNotifyNestedOpenRef.current(delta);
  }, []);

  const childStackValue = useMemo(
    () => ({
      depth: open ? parentStack.depth + 1 : parentStack.depth,
      notifyNestedOpen: notifyChildNestedOpen,
    }),
    [open, parentStack.depth, notifyChildNestedOpen],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setChildNestedOpenCount(0);
      return;
    }

    if (parentStack.depth === 0) {
      return;
    }

    notifyChildNestedOpen(1);
    return () => notifyChildNestedOpen(-1);
  }, [open, parentStack.depth, notifyChildNestedOpen]);

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

    function submitModalForm(target: EventTarget | null) {
      const element = target instanceof HTMLElement ? target : null;
      if (
        element?.tagName === "TEXTAREA" ||
        element?.tagName === "SELECT" ||
        (element instanceof HTMLButtonElement && element.type !== "submit")
      ) {
        return;
      }

      const form =
        element?.closest("form") ??
        panelRef.current?.querySelector<HTMLFormElement>("form");

      if (!form) return;

      form.requestSubmit();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (blocking) return;
      if (childNestedOpenCount > 0) return;

      if (event.key === "Escape") {
        if (confirmExitOpen) {
          event.preventDefault();
          setConfirmExitOpen(false);
          return;
        }

        event.preventDefault();
        closeDirectly();
        return;
      }

      if (event.key !== "Enter" || event.shiftKey) return;

      if (confirmExitOpen) {
        event.preventDefault();
        setConfirmExitOpen(false);
        return;
      }

      const form =
        panelRef.current?.querySelector<HTMLFormElement>("form");

      if (!form) return;

      event.preventDefault();
      submitModalForm(event.target);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, blocking, confirmExitOpen, closeDirectly, childNestedOpenCount]);

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
    if (blocking || confirmExitOpen) return;
    if (childNestedOpenCount > 0) return;
    if (!isBackdropDismissTarget(event.target as Node, panelRef.current)) return;
    if (dirty) {
      requestBackdropConfirm();
      return;
    }
    closeDirectly();
  }

  function handleConfirmBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (confirmPanelRef.current?.contains(event.target as Node)) return;
    cancelExit();
  }

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={overlayBaseClassName}
        style={{ zIndex: overlayZIndex }}
        data-app-modal-overlay=""
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={handleBackdropClick}
      >
        <div className={backdropClassName} aria-hidden="true" />
        <div
          ref={panelRef}
          className={`${panelBaseClassName} ${panelMaxWidthClassName}`}
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
                aria-label={t("actions.close", "Aizvērt")}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>

            <ModalStackProvider value={childStackValue}>
              <div className="mt-6">{children}</div>
            </ModalStackProvider>
          </div>
        </div>
      </div>

      {confirmExitOpen ? (
        <div
          className={confirmOverlayBaseClassName}
          style={{ zIndex: confirmZIndex }}
          data-app-modal-overlay=""
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-exit-title"
          onMouseDown={handleConfirmBackdropClick}
        >
          <div className={confirmBackdropClassName} aria-hidden="true" />
          <div
            ref={confirmPanelRef}
            className={`${panelBaseClassName} max-w-sm`}
          >
            <div className="p-6">
              <h2 id="confirm-exit-title" className="text-lg font-semibold text-zinc-900">
                {t("modal.confirm_exit.title", "Izbeigt darbību?")}
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                {t(
                  "modal.confirm_exit.description",
                  "Vai vēlaties izbeigt šo darbību?",
                )}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelExit}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  {t("actions.continue", "Turpināt")}
                </button>
                <button
                  type="button"
                  onClick={confirmExit}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  {t("actions.end", "Izbeigt")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
