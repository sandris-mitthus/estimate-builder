import type { ModuleContentBlock } from "@/app/lib/modules/types";
import { normalizeModuleContentBlock } from "@/app/lib/modules/resolve-block-asset";

export function parseModuleContentBlocks(value: unknown): ModuleContentBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeModuleContentBlock(entry))
    .filter((block): block is ModuleContentBlock => block !== null);
}
