"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/app/components/translations-provider";
import { writeCookie } from "@/app/lib/client/cookies";
import { ANONYMOUS_LANGUAGE_COOKIE } from "@/app/lib/i18n/language-cookie";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/repository";

/**
 * Language picker for pages an anonymous visitor can reach (landing, login,
 * signup). The root element is `relative`, so the caller positions it.
 */
export function PublicLanguageSelector({
  languages,
  activeLanguageCode,
}: {
  languages: SiteLanguageSummary[];
  activeLanguageCode: string;
}) {
  const router = useRouter();
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [pendingLanguageCode, setPendingLanguageCode] = useState<string | null>(
    null,
  );
  const [isRefreshing, startTransition] = useTransition();
  const activeLanguages = languages.filter((language) => language.isActive);
  const activeLanguage =
    activeLanguages.find((language) => language.code === activeLanguageCode) ??
    activeLanguages[0] ??
    null;
  const isChangingLanguage = pendingLanguageCode !== null || isRefreshing;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (pendingLanguageCode && activeLanguageCode === pendingLanguageCode) {
      setPendingLanguageCode(null);
    }
  }, [activeLanguageCode, pendingLanguageCode]);

  function handleLanguageSelect(code: string) {
    setOpen(false);

    if (code === activeLanguageCode || isChangingLanguage) {
      return;
    }

    setPendingLanguageCode(code);
    writeCookie(ANONYMOUS_LANGUAGE_COOKIE, code);
    startTransition(() => {
      router.refresh();
    });
  }

  if (!activeLanguage || activeLanguages.length <= 1) {
    return null;
  }

  return (
    <div ref={selectorRef} className="relative text-left">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={isChangingLanguage}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {activeLanguage.code}
      </button>

      {open ? (
        <div className="absolute right-0 top-8 z-[70] w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {t("language.selector.label", "Language")}
          </div>
          <div
            role="listbox"
            aria-label={t("language.selector.aria", "Choose language")}
          >
            {activeLanguages.map((language) => {
              const isActive = language.code === activeLanguageCode;

              return (
                <button
                  key={language.code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-zinc-100 font-medium text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span>{language.name}</span>
                  <span className="font-mono text-xs uppercase text-zinc-400">
                    {language.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
