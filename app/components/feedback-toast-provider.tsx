"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FeedbackToast,
  type FeedbackMessage,
  type FeedbackType,
} from "@/app/components/feedback-toast";

type FeedbackToastContextValue = {
  showFeedback: (message: { type: FeedbackType; text: string }) => void;
  clearFeedback: () => void;
};

const FeedbackToastContext = createContext<FeedbackToastContextValue | null>(
  null,
);

export function FeedbackToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const showFeedback = useCallback(
    (nextMessage: { type: FeedbackType; text: string }) => {
      setMessage(nextMessage);
    },
    [],
  );

  const clearFeedback = useCallback(() => {
    setMessage(null);
  }, []);

  const value = useMemo(
    () => ({ showFeedback, clearFeedback }),
    [showFeedback, clearFeedback],
  );

  return (
    <FeedbackToastContext.Provider value={value}>
      {children}
      <FeedbackToast message={message} onDismiss={clearFeedback} />
    </FeedbackToastContext.Provider>
  );
}

export function useFeedbackToast() {
  const context = useContext(FeedbackToastContext);

  if (!context) {
    throw new Error("useFeedbackToast must be used within FeedbackToastProvider");
  }

  return context;
}
