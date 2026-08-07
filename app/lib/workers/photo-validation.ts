import {
  createImageFileValidator,
  RASTER_IMAGE_EXTENSIONS_BY_MIME,
} from "@/app/lib/validation/image-file";

export const WORKER_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const workerPhotoValidator = createImageFileValidator({
  extensionByMimeType: RASTER_IMAGE_EXTENSIONS_BY_MIME,
  maxBytes: WORKER_PHOTO_MAX_BYTES,
  formatError: "Atbalstīti formāti: PNG, JPG, WEBP.",
  formatErrorKey: "errors.logo_format_supported",
  sizeError: "Foto nedrīkst būt lielāks par 5 MB.",
  sizeErrorKey: "errors.worker_photo_too_large",
});

export const WORKER_PHOTO_EXTENSIONS = workerPhotoValidator.extensions;

export function getWorkerPhotoExtension(mimeType: string) {
  return workerPhotoValidator.getExtension(mimeType);
}

export function validateWorkerPhotoFile(file: File) {
  return workerPhotoValidator.validate(file);
}
