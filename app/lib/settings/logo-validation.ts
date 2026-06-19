export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const COMPANY_LOGO_EXTENSIONS = ["png", "jpg", "webp", "svg"] as const;

const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export function getLogoExtension(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return null;
  }
}

export function validateCompanyLogoFile(file: File) {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return {
      ok: false as const,
      error: "Atbalstīti formāti: PNG, JPG, WEBP, SVG.",
    };
  }

  if (file.size > COMPANY_LOGO_MAX_BYTES) {
    return {
      ok: false as const,
      error: "Logotips nedrīkst būt lielāks par 2 MB.",
    };
  }

  return { ok: true as const };
}
