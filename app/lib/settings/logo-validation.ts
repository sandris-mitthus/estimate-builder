import {
  createImageFileValidator,
  RASTER_IMAGE_EXTENSIONS_BY_MIME,
} from "@/app/lib/validation/image-file";

export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024;

const companyLogoValidator = createImageFileValidator({
  extensionByMimeType: RASTER_IMAGE_EXTENSIONS_BY_MIME,
  maxBytes: COMPANY_LOGO_MAX_BYTES,
  formatError: "Atbalstīti formāti: PNG, JPG, WEBP.",
  sizeError: "Logotips nedrīkst būt lielāks par 2 MB.",
});

export const COMPANY_LOGO_EXTENSIONS = companyLogoValidator.extensions;

export function getLogoExtension(mimeType: string) {
  return companyLogoValidator.getExtension(mimeType);
}

export function validateCompanyLogoFile(file: File) {
  return companyLogoValidator.validate(file);
}
