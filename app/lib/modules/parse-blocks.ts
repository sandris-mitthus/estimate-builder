import type { ModuleContentBlock } from "@/app/lib/modules/types";

function isModuleContentBlock(value: unknown): value is ModuleContentBlock {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.fileUrl === "string" &&
    typeof row.mimeType === "string" &&
    typeof row.storagePath === "string"
  );
}

export function parseModuleContentBlocks(value: unknown): ModuleContentBlock[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isModuleContentBlock).map((block) => ({
    id: block.id,
    title: block.title,
    fileUrl: block.fileUrl,
    mimeType: block.mimeType,
    storagePath: block.storagePath,
  }));
}
