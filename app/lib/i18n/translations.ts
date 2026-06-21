export type TranslationDictionary = Record<string, string>;

export type TranslationParams = Record<string, string | number>;

export function interpolateTranslation(
  text: string,
  params: TranslationParams = {},
): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export function translateText(
  dictionary: TranslationDictionary,
  key: string,
  fallback?: string,
  params?: TranslationParams,
): string {
  const text = dictionary[key] || fallback || key;
  return interpolateTranslation(text, params);
}
