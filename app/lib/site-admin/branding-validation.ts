export const SITE_BRANDING_MAX_BYTES = 2 * 1024 * 1024;
export const SITE_BRANDING_EXTENSIONS = ["png", "jpg", "webp", "svg"] as const;

export type SiteBrandingAssetKind = "logo" | "favicon";

const ALLOWED_BRANDING_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export function getSiteBrandingExtension(mimeType: string) {
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

export function validateSiteBrandingFile(file: File) {
  if (!ALLOWED_BRANDING_TYPES.has(file.type)) {
    return {
      ok: false as const,
      error: "Atbalstīti formāti: PNG, JPG, WEBP, SVG.",
    };
  }

  if (file.size > SITE_BRANDING_MAX_BYTES) {
    return {
      ok: false as const,
      error: "Logotips nedrīkst būt lielāks par 2 MB.",
    };
  }

  return { ok: true as const };
}

export function siteBrandingApiPath(kind: SiteBrandingAssetKind): string {
  return kind === "logo" ? "/api/site/logo" : "/api/site/favicon";
}

export function resolveSiteBrandingDisplayUrl(
  kind: SiteBrandingAssetKind,
  storedUrl: string,
): string {
  const trimmed = storedUrl.trim();
  if (!trimmed) return "";
  const prefix = siteBrandingApiPath(kind);
  if (trimmed.startsWith(prefix)) return trimmed;
  return prefix;
}

export function sanitizeSiteBrandingUrl(
  kind: SiteBrandingAssetKind,
  url: string,
): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  const prefix = siteBrandingApiPath(kind);
  return trimmed.startsWith(prefix) ? trimmed : "";
}
