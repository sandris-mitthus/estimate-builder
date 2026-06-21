"use client";

import { createContext, useContext, useMemo } from "react";
import {
  translateText,
  type TranslationDictionary,
  type TranslationParams,
} from "@/app/lib/i18n/translations";

type TranslationsContextValue = {
  languageCode: string;
  translations: TranslationDictionary;
  t: (key: string, fallback?: string, params?: TranslationParams) => string;
};

const TranslationsContext = createContext<TranslationsContextValue | null>(null);

export function TranslationsProvider({
  languageCode,
  translations,
  children,
}: {
  languageCode: string;
  translations: TranslationDictionary;
  children: React.ReactNode;
}) {
  const value = useMemo<TranslationsContextValue>(
    () => ({
      languageCode,
      translations,
      t: (key, fallback, params) => translateText(translations, key, fallback, params),
    }),
    [languageCode, translations],
  );

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations(): TranslationsContextValue {
  const value = useContext(TranslationsContext);

  if (!value) {
    return {
      languageCode: "lv",
      translations: {},
      t: (key, fallback, params) => translateText({}, key, fallback, params),
    };
  }

  return value;
}
