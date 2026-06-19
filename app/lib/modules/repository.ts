import {
  deleteAllModuleBlockFiles,
  deleteModuleBlockFiles,
  uploadModuleBlockFile,
} from "@/app/lib/modules/file-storage";
import { isBuildingModuleDataComplete } from "@/app/lib/modules/building-module-data";
import { parseModuleContentBlocks } from "@/app/lib/modules/parse-blocks";
import { parseModuleOutline } from "@/app/lib/modules/parse-outline";
import { buildModuleSizeSummarySections } from "@/app/lib/modules/format-module-size-summary";
import { hasProjectDescriptionData } from "@/app/lib/modules/has-project-description-data";
import { parseProjectDescriptionFormState } from "@/app/lib/modules/parse-project-description";
import { createEmptyProjectDescriptionFormState } from "@/app/lib/modules/project-description-types";
import { SAMPLE_MODULE_BLOCKS } from "@/app/lib/modules/sample-blocks";
import { SAMPLE_MODULE_OUTLINES } from "@/app/lib/modules/sample-outlines";
import { SAMPLE_BUILDING_MODULES } from "@/app/lib/modules/sample-modules";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import type {
  BuildingModuleDetail,
  BuildingModuleSizeOption,
  BuildingModuleSummary,
  CreateBuildingModuleInput,
  ModuleBlockKind,
  UpdateBuildingModuleBlocksInput,
  UpdateBuildingModuleInput,
  UpdateBuildingModuleProjectDescriptionInput,
} from "@/app/lib/modules/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { isMissingColumnError } from "@/app/lib/supabase/missing-column";

type BuildingModuleRow = {
  id: string;
  name: string;
  outline?: unknown;
  visualization_blocks?: unknown;
  project_blocks?: unknown;
  project_description?: unknown;
};

function mapBuildingModuleSummary(row: BuildingModuleRow): BuildingModuleSummary {
  const visualizationBlocks = parseModuleContentBlocks(row.visualization_blocks);
  const projectBlocks = parseModuleContentBlocks(row.project_blocks);

  return {
    id: row.id,
    name: row.name,
    moduleDataComplete: isBuildingModuleDataComplete({
      visualizationBlocks,
      projectBlocks,
    }),
  };
}

function mapBuildingModule(row: BuildingModuleRow): BuildingModuleSummary {
  return mapBuildingModuleSummary(row);
}

function mapBuildingModuleDetail(row: BuildingModuleRow): BuildingModuleDetail {
  return {
    ...mapBuildingModule(row),
    outline: parseModuleOutline(row.outline),
    visualizationBlocks: parseModuleContentBlocks(row.visualization_blocks),
    projectBlocks: parseModuleContentBlocks(row.project_blocks),
    projectDescription: parseProjectDescriptionFormState(row.project_description),
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
    projectDescription: createEmptyProjectDescriptionFormState(),
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

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return SAMPLE_BUILDING_MODULES;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("building_modules")
    .select("id, name, visualization_blocks, project_blocks")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error || !data) {
    return SAMPLE_BUILDING_MODULES;
  }

  return data.map((row) => mapBuildingModuleSummary(row as BuildingModuleRow));
}

export async function listBuildingModuleSizeOptions(): Promise<
  BuildingModuleSizeOption[]
> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("building_modules")
    .select("id, name, project_description")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error && isMissingColumnError(error, "project_description")) {
    return [];
  }

  if (error || !data) {
    return [];
  }

  return (data as BuildingModuleRow[])
    .map((row) => {
      const projectDescription = parseProjectDescriptionFormState(
        row.project_description,
      );
      if (!hasProjectDescriptionData(projectDescription)) {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
        sections: buildModuleSizeSummarySections(projectDescription),
        projectDescription,
      } satisfies BuildingModuleSizeOption;
    })
    .filter((entry): entry is BuildingModuleSizeOption => entry != null);
}

export async function getBuildingModule(
  id: string,
): Promise<BuildingModuleDetail | null> {
  if (!isSupabaseAdminConfigured()) {
    return getSampleBuildingModule(id);
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return getSampleBuildingModule(id);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("building_modules")
    .select("id, name, outline, visualization_blocks, project_blocks, project_description")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!error && data) {
    return mapBuildingModuleDetail(data as BuildingModuleRow);
  }

  if (error && isMissingColumnError(error, "project_description")) {
    const legacy = await supabase
      .from("building_modules")
      .select("id, name, outline, visualization_blocks, project_blocks")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (!legacy.error && legacy.data) {
      return mapBuildingModuleDetail(legacy.data as BuildingModuleRow);
    }

    if (legacy.error) {
      console.error("getBuildingModule:", legacy.error.message);
    }
  } else if (error) {
    console.error("getBuildingModule:", error.message);
  }

  return getSampleBuildingModule(id);
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

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("building_modules")
    .insert({ company_id: companyId, name })
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

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("building_modules")
    .update({ name })
    .eq("id", input.id)
    .eq("company_id", companyId);

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

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("building_modules")
    .update({
      visualization_blocks: input.visualizationBlocks,
      project_blocks: input.projectBlocks,
    })
    .eq("id", input.id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt bloku secību." };
  }

  return { ok: true };
}

export async function updateBuildingModuleProjectDescription(
  input: UpdateBuildingModuleProjectDescriptionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("building_modules")
    .update({ project_description: input.projectDescription })
    .eq("id", input.id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt projekta aprakstu." };
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

  const mod = await getBuildingModule(moduleId);
  if (!mod) {
    await deleteModuleBlockFiles([uploadResult.block.storagePath]);
    return { ok: false, error: "Modulis nav atrasts." };
  }

  const updateResult = await updateBuildingModuleBlocks({
    id: moduleId,
    visualizationBlocks:
      kind === "visualization"
        ? [...mod.visualizationBlocks, uploadResult.block]
        : mod.visualizationBlocks,
    projectBlocks:
      kind === "project"
        ? [...mod.projectBlocks, uploadResult.block]
        : mod.projectBlocks,
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
  const mod = await getBuildingModule(moduleId);
  if (!mod) {
    return { ok: false, error: "Modulis nav atrasts." };
  }

  const blocks =
    kind === "visualization" ? mod.visualizationBlocks : mod.projectBlocks;
  const block = blocks.find((entry) => entry.id === blockId);

  if (!block) {
    return { ok: false, error: "Bloks nav atrasts." };
  }

  const updateResult = await updateBuildingModuleBlocks({
    id: moduleId,
    visualizationBlocks:
      kind === "visualization"
        ? mod.visualizationBlocks.filter((entry) => entry.id !== blockId)
        : mod.visualizationBlocks,
    projectBlocks:
      kind === "project"
        ? mod.projectBlocks.filter((entry) => entry.id !== blockId)
        : mod.projectBlocks,
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

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  await deleteAllModuleBlockFiles(id);

  const { error } = await supabase
    .from("building_modules")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst moduli." };
  }

  return { ok: true };
}
