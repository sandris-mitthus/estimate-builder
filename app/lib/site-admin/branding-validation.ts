import {
  createImageFileValidator,
  RASTER_AND_SVG_EXTENSIONS_BY_MIME,
} from "@/app/lib/validation/image-file";

export const SITE_BRANDING_MAX_BYTES = 2 * 1024 * 1024;

export type SiteBrandingAssetKind = "logo" | "favicon";

const siteBrandingValidator = createImageFileValidator({
  extensionByMimeType: RASTER_AND_SVG_EXTENSIONS_BY_MIME,
  maxBytes: SITE_BRANDING_MAX_BYTES,
  formatError: "Atbalstīti formāti: PNG, JPG, WEBP, SVG.",
  sizeError: "Logotips nedrīkst būt lielāks par 2 MB.",
});

export const SITE_BRANDING_EXTENSIONS = siteBrandingValidator.extensions;

export function getSiteBrandingExtension(mimeType: string) {
  return siteBrandingValidator.getExtension(mimeType);
}

export function validateSiteBrandingFile(file: File) {
  return siteBrandingValidator.validate(file);
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
