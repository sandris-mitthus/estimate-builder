import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  BOOTSTRAP_COMPANY_ID,
  getCurrentCompanyId,
} from "@/app/lib/companies/current-company";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateFileMagicBytes } from "@/app/lib/security/magic-bytes";
import {
  getImageExtension,
  validateModuleBlockFile,
} from "@/app/lib/modules/file-validation";
import { moduleAssetProxyUrl } from "@/app/lib/modules/resolve-block-asset";
import type { ModuleBlockKind, ModuleContentBlock } from "@/app/lib/modules/types";

export const MODULE_ASSETS_BUCKET = "module-assets";

function sanitizeFileName(name: string): string {
  const base = name.trim().replace(/[/\\?%*:|"<>]/g, "-");
  return base.length > 0 ? base : "fails";
}

function blockFolder(kind: ModuleBlockKind): string {
  return kind === "visualization" ? "visualizations" : "project";
}

export type ModuleBlockStorageScope = "module" | "project";

function storageRoot(
  scope: ModuleBlockStorageScope,
  ownerId: string,
  companyId: string,
): string {
  const ownerFolder = scope === "module" ? "modules" : "projects";
  return `companies/${companyId}/${ownerFolder}/${ownerId}`;
}

function legacyStorageRoot(scope: ModuleBlockStorageScope, ownerId: string): string {
  return scope === "module" ? `modules/${ownerId}` : `projects/${ownerId}`;
}

export async function uploadScopedBlockFile(
  scope: ModuleBlockStorageScope,
  ownerId: string,
  kind: ModuleBlockKind,
  file: File,
): Promise<{ ok: true; block: ModuleContentBlock } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const validation = validateModuleBlockFile(kind, file);

  if (!validation.ok) {
    return validation;
  }

  const magicCheck = await validateFileMagicBytes(file, file.type);
  if (!magicCheck.ok) {
    return magicCheck;
  }

  const blockId = crypto.randomUUID();
  let storagePath: string;
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const root = storageRoot(scope, ownerId, companyId);

  if (kind === "visualization") {
    const extension = getImageExtension(file.type);
    if (!extension) {
      return { ok: false, error: "Neatbalstīts attēla formāts." };
    }
    storagePath = `${root}/${blockFolder(kind)}/${blockId}.${extension}`;
  } else {
    storagePath = `${root}/${blockFolder(kind)}/${blockId}.pdf`;
  }

  const supabase = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(MODULE_ASSETS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: "Neizdevās augšupielādēt failu." };
  }

  const proxyUrl = moduleAssetProxyUrl(storagePath);

  return {
    ok: true,
    block: {
      id: blockId,
      title: sanitizeFileName(file.name),
      fileUrl: proxyUrl,
      mimeType: file.type,
      storagePath,
    },
  };
}

export async function uploadModuleBlockFile(
  moduleId: string,
  kind: ModuleBlockKind,
  file: File,
): Promise<{ ok: true; block: ModuleContentBlock } | { ok: false; error: string }> {
  return uploadScopedBlockFile("module", moduleId, kind, file);
}

function extensionFromBlock(
  block: ModuleContentBlock,
  kind: ModuleBlockKind,
): string {
  const fileName = block.storagePath.split("/").pop() ?? "";
  const dot = fileName.lastIndexOf(".");
  if (dot >= 0 && dot < fileName.length - 1) {
    return fileName.slice(dot + 1);
  }

  if (kind === "project") {
    return "pdf";
  }

  return getImageExtension(block.mimeType) ?? "bin";
}

/** Copy module asset files into a new module folder with fresh block IDs. */
export async function copyModuleContentBlocks(
  blocks: ModuleContentBlock[],
  targetModuleId: string,
  kind: ModuleBlockKind,
): Promise<
  | { ok: true; blocks: ModuleContentBlock[] }
  | { ok: false; error: string; copiedPaths: string[] }
> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta.",
      copiedPaths: [],
    };
  }

  if (blocks.length === 0) {
    return { ok: true, blocks: [] };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return {
      ok: false,
      error: "Uzņēmums nav atrasts.",
      copiedPaths: [],
    };
  }

  const supabase = createAdminClient();
  const root = storageRoot("module", targetModuleId, companyId);
  const copiedPaths: string[] = [];
  const nextBlocks: ModuleContentBlock[] = [];

  for (const block of blocks) {
    const blockId = crypto.randomUUID();
    const extension = extensionFromBlock(block, kind);
    const storagePath = `${root}/${blockFolder(kind)}/${blockId}.${extension}`;

    const { error: copyError } = await supabase.storage
      .from(MODULE_ASSETS_BUCKET)
      .copy(block.storagePath, storagePath);

    if (copyError) {
      return {
        ok: false,
        error: "Neizdevās nokopēt moduļa failus.",
        copiedPaths,
      };
    }

    copiedPaths.push(storagePath);
    nextBlocks.push({
      id: blockId,
      title: block.title,
      mimeType: block.mimeType,
      storagePath,
      fileUrl: moduleAssetProxyUrl(storagePath),
    });
  }

  return { ok: true, blocks: nextBlocks };
}

export async function uploadProjectBlockFile(
  projectId: string,
  kind: ModuleBlockKind,
  file: File,
): Promise<{ ok: true; block: ModuleContentBlock } | { ok: false; error: string }> {
  return uploadScopedBlockFile("project", projectId, kind, file);
}

export async function deleteModuleBlockFiles(storagePaths: string[]) {
  if (!isSupabaseAdminConfigured() || storagePaths.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.storage.from(MODULE_ASSETS_BUCKET).remove(storagePaths);
}

export async function deleteAllModuleBlockFiles(moduleId: string) {
  await deleteAllScopedBlockFiles("module", moduleId);
}

export async function deleteAllProjectBlockFiles(projectId: string) {
  await deleteAllScopedBlockFiles("project", projectId);
}

async function deleteAllScopedBlockFiles(
  scope: ModuleBlockStorageScope,
  ownerId: string,
) {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = createAdminClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return;
  }

  const roots = [storageRoot(scope, ownerId, companyId)];
  if (companyId === BOOTSTRAP_COMPANY_ID) {
    roots.push(legacyStorageRoot(scope, ownerId));
  }

  for (const root of roots) {
    const prefixes = [`${root}/visualizations`, `${root}/project`];

    for (const prefix of prefixes) {
      const { data } = await supabase.storage
        .from(MODULE_ASSETS_BUCKET)
        .list(prefix);

      if (!data?.length) continue;

      await supabase.storage
        .from(MODULE_ASSETS_BUCKET)
        .remove(data.map((file) => `${prefix}/${file.name}`));
    }
  }
}
