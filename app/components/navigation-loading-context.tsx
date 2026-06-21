"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslations } from "@/app/components/translations-provider";

type NavigationLoadingContextValue = {
  beginNavigation: (href: string, message?: string) => void;
};

const NavigationLoadingContext =
  createContext<NavigationLoadingContextValue | null>(null);

function NavigationLoadingOverlay({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/55 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-8 py-6 shadow-lg">
        <i
          className="fas fa-spinner animate-spin text-2xl text-zinc-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-zinc-700">{message}</p>
      </div>
    </div>
  );
}

export function NavigationLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const [pendingNavigation, setPendingNavigation] = useState<{
    href: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    setPendingNavigation(null);
  }, [pathname]);

  const beginNavigation = useCallback(
    (href: string, message?: string) => {
      setPendingNavigation({
        href,
        message: message ?? t("common.loading", "Ielādē…"),
      });
    },
    [t],
  );

  const value = useMemo(
    () => ({
      beginNavigation,
    }),
    [beginNavigation],
  );

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
      {pendingNavigation ? (
        <NavigationLoadingOverlay message={pendingNavigation.message} />
      ) : null}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading(): NavigationLoadingContextValue {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error(
      "useNavigationLoading must be used within NavigationLoadingProvider",
    );
  }
  return context;
}

export function useOptionalNavigationLoading(): NavigationLoadingContextValue | null {
  return useContext(NavigationLoadingContext);
}

export function isPlainPrimaryNavigationClick(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
