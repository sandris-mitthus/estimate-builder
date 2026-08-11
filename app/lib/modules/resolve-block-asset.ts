import type { ModuleContentBlock } from "@/app/lib/modules/types";

export function moduleAssetProxyUrl(storagePath: string): string {
  return `/api/modules/asset?path=${encodeURIComponent(storagePath)}`;
}

export function extractStoragePathFromFileUrl(fileUrl: string): string | null {
  const trimmed = fileUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.startsWith("/api/modules/asset")) {
      const params = new URL(trimmed, "http://localhost").searchParams;
      const path = params.get("path")?.trim();
      return path || null;
    }

    const patterns = [
      /\/storage\/v1\/object\/(?:public|authenticated|sign)\/module-assets\/(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match?.[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  } catch {
    return null;
  }

  return null;
}

function inferMimeTypeFromStoragePath(storagePath: string): string | null {
  const lower = storagePath.toLowerCase();

  if (lower.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (lower.endsWith(".png")) {
    return "image/png";
  }

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  if (lower.endsWith(".gif")) {
    return "image/gif";
  }

  return null;
}

export function normalizeModuleContentBlock(
  value: unknown,
): ModuleContentBlock | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.title !== "string") {
    return null;
  }

  let storagePath =
    typeof row.storagePath === "string" ? row.storagePath.trim() : "";
  const rawFileUrl = typeof row.fileUrl === "string" ? row.fileUrl.trim() : "";

  if (!storagePath && rawFileUrl) {
    storagePath = extractStoragePathFromFileUrl(rawFileUrl) ?? "";
  }

  if (!storagePath) {
    return null;
  }

  const mimeType =
    typeof row.mimeType === "string" && row.mimeType.trim()
      ? row.mimeType.trim()
      : inferMimeTypeFromStoragePath(storagePath);

  if (!mimeType) {
    return null;
  }

  const fileUrl = moduleAssetProxyUrl(storagePath);

  return {
    id: row.id,
    title: row.title,
    fileUrl,
    mimeType,
    storagePath,
  };
}

export function resolveModuleBlockAssetUrl(block: ModuleContentBlock): string {
  return moduleAssetProxyUrl(block.storagePath);
}

/** True when path is under companies/{companyId}/ with no traversal. */
export function isModuleStoragePathForCompany(
  storagePath: string,
  companyId: string,
): boolean {
  const trimmed = storagePath.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) {
    return false;
  }
  const prefix = `companies/${companyId}/`;
  return trimmed.startsWith(prefix);
}

/**
 * Keeps only blocks whose storagePath belongs to the company.
 * Returns null if any block is out of scope (reject whole write).
 */
export function assertModuleBlocksForCompany(
  blocks: ModuleContentBlock[],
  companyId: string,
): { ok: true; blocks: ModuleContentBlock[] } | { ok: false } {
  const sanitized: ModuleContentBlock[] = [];
  for (const block of blocks) {
    if (!isModuleStoragePathForCompany(block.storagePath, companyId)) {
      return { ok: false };
    }
    sanitized.push({
      ...block,
      fileUrl: moduleAssetProxyUrl(block.storagePath),
    });
  }
  return { ok: true, blocks: sanitized };
}
