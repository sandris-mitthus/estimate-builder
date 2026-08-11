import { cache } from "react";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getAnonymousActiveLanguageCode } from "@/app/lib/i18n/anonymous-language";
import {
  getSiteTranslationDictionary,
  getUserActiveLanguageCode,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
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

export const getServerTranslations = cache(
  async function getServerTranslations(): Promise<ServerTranslations> {
    let languageCode = "lv";

    if (isSupabaseAdminConfigured()) {
      const user = await getCurrentUser();
      if (user) {
        languageCode = await getUserActiveLanguageCode(user.id);
      } else {
        const languages = await listSiteLanguages({ activeOnly: true });
        languageCode = await getAnonymousActiveLanguageCode(languages);
      }
    }

    const translations = await getSiteTranslationDictionary(languageCode);

    return {
      languageCode,
      translations,
      t: (key, fallback, params) =>
        translateText(translations, key, fallback, params),
    };
  },
);
