export type ImageFileValidationResult =
  | { ok: true }
  | { ok: false; error: string; errorKey?: string };

export const RASTER_IMAGE_EXTENSIONS_BY_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export const RASTER_AND_SVG_EXTENSIONS_BY_MIME = {
  ...RASTER_IMAGE_EXTENSIONS_BY_MIME,
  "image/svg+xml": "svg",
} as const;

type ImageFileRules = {
  extensionByMimeType: Record<string, string>;
  maxBytes: number;
  formatError: string;
  sizeError: string;
  formatErrorKey?: string;
  sizeErrorKey?: string;
};

export type ImageFileValidator = {
  /** Stored file extensions, in mime-map order and without duplicates. */
  extensions: readonly string[];
  maxBytes: number;
  getExtension: (mimeType: string) => string | null;
  validate: (file: File) => ImageFileValidationResult;
};

/** Shared mime + size validation for uploaded images (logos, photos, module images). */
export function createImageFileValidator(
  rules: ImageFileRules,
): ImageFileValidator {
  const extensions = [...new Set(Object.values(rules.extensionByMimeType))];

  return {
    extensions,
    maxBytes: rules.maxBytes,
    getExtension(mimeType) {
      return rules.extensionByMimeType[mimeType] ?? null;
    },
    validate(file) {
      if (!(file.type in rules.extensionByMimeType)) {
        return {
          ok: false,
          error: rules.formatError,
          ...(rules.formatErrorKey ? { errorKey: rules.formatErrorKey } : {}),
        };
      }

      if (file.size > rules.maxBytes) {
        return {
          ok: false,
          error: rules.sizeError,
          ...(rules.sizeErrorKey ? { errorKey: rules.sizeErrorKey } : {}),
        };
      }

      return { ok: true };
    },
  };
}
