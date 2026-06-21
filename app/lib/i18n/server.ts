import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  getDefaultSiteLanguageCode,
  getSiteTranslationDictionary,
  getUserActiveLanguageCode,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { ANONYMOUS_LANGUAGE_COOKIE } from "@/app/lib/i18n/language-cookie";
import {
  translateText,
  type TranslationDictionary,
  type TranslationParams,
} from "@/app/lib/i18n/translations";

export type ServerTranslations = {
  languageCode: string;
  translations: TranslationDictionary;
  t: (key: string, fallback?: string, params?: TranslationParams) => string;
};

export async function getServerTranslations(): Promise<ServerTranslations> {
  let languageCode = "lv";

  if (isSupabaseAdminConfigured()) {
    const user = await getCurrentUser();
    if (user) {
      languageCode = await getUserActiveLanguageCode(user.id);
    } else {
      const [languages, defaultCode, cookieStore] = await Promise.all([
        listSiteLanguages({ activeOnly: true }),
        getDefaultSiteLanguageCode(),
        cookies(),
      ]);
      const activeCodes = new Set(languages.map((language) => language.code));
      const cookieCode =
        cookieStore.get(ANONYMOUS_LANGUAGE_COOKIE)?.value?.trim() ?? "";

      languageCode = activeCodes.has(cookieCode)
        ? cookieCode
        : activeCodes.has(defaultCode)
          ? defaultCode
          : (languages[0]?.code ?? "lv");
    }
  }

  const translations = await getSiteTranslationDictionary(languageCode);

  return {
    languageCode,
    translations,
    t: (key, fallback, params) => translateText(translations, key, fallback, params),
  };
}
