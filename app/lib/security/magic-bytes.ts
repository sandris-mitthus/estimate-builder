/**
 * Server-side magic-byte validation for uploaded files.
 * Validates the actual file header bytes, not the browser-supplied Content-Type.
 */

const SIGNATURES: Array<{
  mimeType: string;
  bytes: number[];
  offset?: number;
}> = [
  { mimeType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mimeType: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mimeType: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mimeType: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mimeType: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mimeType: "image/svg+xml", bytes: [] },
];

function matchesSignature(
  header: Uint8Array,
  bytes: number[],
  offset = 0,
): boolean {
  if (bytes.length === 0) return true;
  for (let i = 0; i < bytes.length; i++) {
    if (header[offset + i] !== bytes[i]) return false;
  }
  return true;
}

export async function validateFileMagicBytes(
  file: File,
  expectedMimeType: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (expectedMimeType === "image/svg+xml") {
    const text = await file.text();
    const trimmed = text.trimStart().toLowerCase();
    if (!trimmed.startsWith("<svg") && !trimmed.startsWith("<?xml")) {
      return { ok: false, error: "SVG fails nav derīgs." };
    }
    return { ok: true };
  }

  const HEADER_BYTES = 12;
  const buffer = await file.slice(0, HEADER_BYTES).arrayBuffer();
  const header = new Uint8Array(buffer);

  const matching = SIGNATURES.filter((s) => s.mimeType === expectedMimeType);
  if (matching.length === 0) return { ok: true };

  if (expectedMimeType === "image/webp") {
    const riff = matchesSignature(header, [0x52, 0x49, 0x46, 0x46], 0);
    const webp = matchesSignature(header, [0x57, 0x45, 0x42, 0x50], 8);
    if (riff && webp) return { ok: true };
    return { ok: false, error: "Fails neatbilst deklarētajam WebP formātam." };
  }

  for (const sig of matching) {
    if (matchesSignature(header, sig.bytes, sig.offset ?? 0)) {
      return { ok: true };
    }
  }

  return { ok: false, error: "Faila saturs neatbilst deklarētajam formātam." };
}
