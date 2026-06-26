export const WORKER_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const WORKER_PHOTO_EXTENSIONS = ["png", "jpg", "webp"] as const;

const ALLOWED_PHOTO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function getWorkerPhotoExtension(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export function validateWorkerPhotoFile(file: File) {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return {
      ok: false as const,
      error: "Atbalstīti formāti: PNG, JPG, WEBP.",
      errorKey: "errors.logo_format_supported",
    };
  }

  if (file.size > WORKER_PHOTO_MAX_BYTES) {
    return {
      ok: false as const,
      error: "Foto nedrīkst būt lielāks par 5 MB.",
      errorKey: "errors.worker_photo_too_large",
    };
  }

  return { ok: true as const };
}
