"use client";

import { useEffect, useRef, useState } from "react";

export type FeedbackType = "success" | "error";

export type FeedbackMessage = {
  type: FeedbackType;
  text: string;
};

const AUTO_DISMISS_MS = 5000;

type FeedbackToastProps = {
  message: FeedbackMessage | null;
  onDismiss: () => void;
};

export function FeedbackToast({ message, onDismiss }: FeedbackToastProps) {
  const [isHovered, setIsHovered] = useState(false);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message || isHovered) {
      return;
    }

    dismissTimeoutRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
  }, [message, isHovered, onDismiss]);

  useEffect(() => {
    if (!message) {
      setIsHovered(false);
    }
  }, [message]);

  if (!message) {
    return null;
  }

  function handleMouseEnter() {
    setIsHovered(true);

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  }

  function handleMouseLeave() {
    setIsHovered(false);
    onDismiss();
  }

  const isSuccess = message.type === "success";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      aria-live="polite"
    >
      <div
        role="status"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`pointer-events-auto flex max-w-md cursor-default items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg transition ${
          isSuccess
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <i
          className={`fas mt-0.5 shrink-0 text-base ${
            isSuccess ? "fa-circle-check text-emerald-600" : "fa-circle-exclamation text-red-600"
          }`}
          aria-hidden="true"
        />
        <p className="min-w-0 cursor-default leading-snug">{message.text}</p>
      </div>
    </div>
  );
}
