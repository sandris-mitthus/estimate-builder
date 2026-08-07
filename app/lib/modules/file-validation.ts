import type { ModuleBlockKind } from "@/app/lib/modules/types";
import {
  createImageFileValidator,
  RASTER_IMAGE_EXTENSIONS_BY_MIME,
} from "@/app/lib/validation/image-file";

export const MODULE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const MODULE_PDF_MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_PROJECT_TYPES = new Set(["application/pdf"]);

const moduleImageValidator = createImageFileValidator({
  extensionByMimeType: {
    ...RASTER_IMAGE_EXTENSIONS_BY_MIME,
    "image/gif": "gif",
  },
  maxBytes: MODULE_IMAGE_MAX_BYTES,
  formatError: "Vizualizācijām atbalstīti tikai attēli (PNG, JPG, WEBP, GIF).",
  sizeError: "Attēls nedrīkst būt lielāks par 10 MB.",
});

export const MODULE_IMAGE_EXTENSIONS = moduleImageValidator.extensions;

export function getImageExtension(mimeType: string): string | null {
  return moduleImageValidator.getExtension(mimeType);
}

export function validateModuleImageFile(file: File) {
  return moduleImageValidator.validate(file);
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
