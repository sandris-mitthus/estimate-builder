import {
  deleteAllModuleBlockFiles,
  deleteModuleBlockFiles,
  uploadModuleBlockFile,
} from "@/app/lib/modules/file-storage";
import { parseModuleContentBlocks } from "@/app/lib/modules/parse-blocks";
import { parseModuleOutline } from "@/app/lib/modules/parse-outline";
import { SAMPLE_MODULE_BLOCKS } from "@/app/lib/modules/sample-blocks";
import { SAMPLE_MODULE_OUTLINES } from "@/app/lib/modules/sample-outlines";
import { SAMPLE_BUILDING_MODULES } from "@/app/lib/modules/sample-modules";
import type {
  BuildingModuleDetail,
  BuildingModuleSummary,
  CreateBuildingModuleInput,
  ModuleBlockKind,
  UpdateBuildingModuleBlocksInput,
  UpdateBuildingModuleInput,
} from "@/app/lib/modules/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type BuildingModuleRow = {
  id: string;
  name: string;
  outline?: unknown;
  visualization_blocks?: unknown;
  project_blocks?: unknown;
};

function mapBuildingModule(row: BuildingModuleRow): BuildingModuleSummary {
  return {
    id: row.id,
    name: row.name,
  };
}

function mapBuildingModuleDetail(row: BuildingModuleRow): BuildingModuleDetail {
  return {
    ...mapBuildingModule(row),
    outline: parseModuleOutline(row.outline),
    visualizationBlocks: parseModuleContentBlocks(row.visualization_blocks),
    projectBlocks: parseModuleContentBlocks(row.project_blocks),
  };
}

function getSampleBuildingModule(id: string): BuildingModuleDetail | null {
  const summary = SAMPLE_BUILDING_MODULES.find((module) => module.id === id);
  if (!summary) return null;

  const sampleBlocks = SAMPLE_MODULE_BLOCKS[id];

  return {
    ...summary,
    outline: SAMPLE_MODULE_OUTLINES[id] ?? [],
    visualizationBlocks: sampleBlocks?.visualizationBlocks ?? [],
    projectBlocks: sampleBlocks?.projectBlocks ?? [],
  };
}

function validateName(name: string): string | null {
  if (!name.trim()) {
    return "Ievadi nosaukumu.";
  }

  return null;
}

export async function listBuildingModules(): Promise<BuildingModuleSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_BUILDING_MODULES;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("building_modules")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !data) {
    return SAMPLE_BUILDING_MODULES;
  }

  return data.map((row) => mapBuildingModule(row as BuildingModuleRow));
}

export async function getBuildingModule(
  id: string,
): Promise<BuildingModuleDetail | null> {
  if (!isSupabaseAdminConfigured()) {
    return getSampleBuildingModule(id);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("building_modules")
    .select("id, name, outline, visualization_blocks, project_blocks")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return getSampleBuildingModule(id);
  }

  return mapBuildingModuleDetail(data as BuildingModuleRow);
}

export async function createBuildingModule(
  input: CreateBuildingModuleInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const validationError = validateName(name);

  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("building_modules")
    .insert({ name })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās pievienot moduli." };
  }

  return { ok: true, id: data.id };
}

export async function updateBuildingModule(
  input: UpdateBuildingModuleInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const validationError = validateName(name);

  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("building_modules")
    .update({ name })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt moduli." };
  }

  return { ok: true };
}

export async function updateBuildingModuleBlocks(
  input: UpdateBuildingModuleBlocksInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("building_modules")
    .update({
      visualization_blocks: input.visualizationBlocks,
      project_blocks: input.projectBlocks,
    })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt bloku secību." };
  }

  return { ok: true };
}

export async function uploadBuildingModuleBlock(
  moduleId: string,
  kind: ModuleBlockKind,
  file: File,
): Promise<
  { ok: true; block: BuildingModuleDetail["visualizationBlocks"][number] } | { ok: false; error: string }
> {
  const uploadResult = await uploadModuleBlockFile(moduleId, kind, file);
  if (!uploadResult.ok) {
    return uploadResult;
  }

  const module = await getBuildingModule(moduleId);
  if (!module) {
    await deleteModuleBlockFiles([uploadResult.block.storagePath]);
    return { ok: false, error: "Modulis nav atrasts." };
  }

  const updateResult = await updateBuildingModuleBlocks({
    id: moduleId,
    visualizationBlocks:
      kind === "visualization"
        ? [...module.visualizationBlocks, uploadResult.block]
        : module.visualizationBlocks,
    projectBlocks:
      kind === "project"
        ? [...module.projectBlocks, uploadResult.block]
        : module.projectBlocks,
  });

  if (!updateResult.ok) {
    await deleteModuleBlockFiles([uploadResult.block.storagePath]);
    return updateResult;
  }

  return { ok: true, block: uploadResult.block };
}

export async function removeBuildingModuleBlock(
  moduleId: string,
  kind: ModuleBlockKind,
  blockId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const module = await getBuildingModule(moduleId);
  if (!module) {
    return { ok: false, error: "Modulis nav atrasts." };
  }

  const blocks =
    kind === "visualization" ? module.visualizationBlocks : module.projectBlocks;
  const block = blocks.find((entry) => entry.id === blockId);

  if (!block) {
    return { ok: false, error: "Bloks nav atrasts." };
  }

  const updateResult = await updateBuildingModuleBlocks({
    id: moduleId,
    visualizationBlocks:
      kind === "visualization"
        ? module.visualizationBlocks.filter((entry) => entry.id !== blockId)
        : module.visualizationBlocks,
    projectBlocks:
      kind === "project"
        ? module.projectBlocks.filter((entry) => entry.id !== blockId)
        : module.projectBlocks,
  });

  if (!updateResult.ok) {
    return updateResult;
  }

  await deleteModuleBlockFiles([block.storagePath]);
  return { ok: true };
}

export async function deleteBuildingModule(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  await deleteAllModuleBlockFiles(id);

  const { error } = await supabase.from("building_modules").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst moduli." };
  }

  return { ok: true };
}
