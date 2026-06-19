import type { ModuleBlockKind } from "@/app/lib/modules/types";

export const MODULE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const MODULE_PDF_MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const ALLOWED_PROJECT_TYPES = new Set(["application/pdf"]);

export function getImageExtension(mimeType: string): string | null {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

export function validateModuleImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false as const,
      error: "Vizualizācijām atbalstīti tikai attēli (PNG, JPG, WEBP, GIF).",
    };
  }

  if (file.size > MODULE_IMAGE_MAX_BYTES) {
    return {
      ok: false as const,
      error: "Attēls nedrīkst būt lielāks par 10 MB.",
    };
  }

  return { ok: true as const };
}

export function validateModuleProjectFile(file: File) {
  if (!ALLOWED_PROJECT_TYPES.has(file.type)) {
    return {
      ok: false as const,
      error: "Projekta sadaļai atbalstīti tikai PDF faili.",
    };
  }

  if (file.size > MODULE_PDF_MAX_BYTES) {
    return {
      ok: false as const,
      error: "PDF fails nedrīkst būt lielāks par 20 MB.",
    };
  }

  return { ok: true as const };
}

export function validateModuleBlockFile(kind: ModuleBlockKind, file: File) {
  return kind === "visualization"
    ? validateModuleImageFile(file)
    : validateModuleProjectFile(file);
}
