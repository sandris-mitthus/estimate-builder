import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateFileMagicBytes } from "@/app/lib/security/magic-bytes";
import type { ModuleBlockKind, ModuleContentBlock } from "@/app/lib/modules/types";

export const MODULE_ASSETS_BUCKET = "module-assets";
export const MODULE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const MODULE_PDF_MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const ALLOWED_PROJECT_TYPES = new Set(["application/pdf"]);

function sanitizeFileName(name: string): string {
  const base = name.trim().replace(/[/\\?%*:|"<>]/g, "-");
  return base.length > 0 ? base : "fails";
}

function getImageExtension(mimeType: string): string | null {
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

function blockFolder(kind: ModuleBlockKind): string {
  return kind === "visualization" ? "visualizations" : "project";
}

export type ModuleBlockStorageScope = "module" | "project";

function storageRoot(scope: ModuleBlockStorageScope, ownerId: string): string {
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

  const validation =
    kind === "visualization"
      ? validateModuleImageFile(file)
      : validateModuleProjectFile(file);

  if (!validation.ok) {
    return validation;
  }

  const magicCheck = await validateFileMagicBytes(file, file.type);
  if (!magicCheck.ok) {
    return magicCheck;
  }

  const blockId = crypto.randomUUID();
  let storagePath: string;
  const root = storageRoot(scope, ownerId);

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

  const proxyUrl = `/api/modules/asset?path=${encodeURIComponent(storagePath)}`;

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
  const root = storageRoot(scope, ownerId);
  const prefixes = [
    `${root}/visualizations`,
    `${root}/project`,
  ];

  for (const prefix of prefixes) {
    const { data } = await supabase.storage.from(MODULE_ASSETS_BUCKET).list(prefix);

    if (!data?.length) continue;

    await supabase.storage
      .from(MODULE_ASSETS_BUCKET)
      .remove(data.map((file) => `${prefix}/${file.name}`));
  }
}
