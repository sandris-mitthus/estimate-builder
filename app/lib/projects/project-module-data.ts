import {
  deleteModuleBlockFiles,
  uploadProjectBlockFile,
} from "@/app/lib/modules/file-storage";
import { assertModuleBlocksForCompany } from "@/app/lib/modules/resolve-block-asset";
import type { ModuleBlockKind, ModuleContentBlock } from "@/app/lib/modules/types";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { parseProjectModuleBlocks } from "@/app/lib/projects/project-module-utils";
import type { UpdateProjectModuleBlocksInput, UpdateProjectProjectDescriptionInput } from "@/app/lib/projects/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

async function getProjectModuleBlocks(projectId: string): Promise<{
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
} | null> {
  if (!isSupabaseAdminConfigured()) {
    return { visualizationBlocks: [], projectBlocks: [] };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("visualization_blocks, project_blocks")
    .eq("id", projectId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseProjectModuleBlocks(data);
}

export async function updateProjectModuleBlocks(
  input: UpdateProjectModuleBlocksInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const visualization = assertModuleBlocksForCompany(
    input.visualizationBlocks,
    companyId,
  );
  const project = assertModuleBlocksForCompany(input.projectBlocks, companyId);
  if (!visualization.ok || !project.ok) {
    return { ok: false, error: "Nederīgs faila ceļš." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({
      visualization_blocks: visualization.blocks,
      project_blocks: project.blocks,
    })
    .eq("id", input.id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt bloku secību." };
  }

  return { ok: true };
}

export async function updateProjectProjectDescription(
  input: UpdateProjectProjectDescriptionInput,
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
    .from("projects")
    .update({ project_description: input.projectDescription })
    .eq("id", input.id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt projekta aprakstu." };
  }

  return { ok: true };
}

export async function uploadProjectModuleBlock(
  projectId: string,
  kind: ModuleBlockKind,
  file: File,
): Promise<
  { ok: true; block: ModuleContentBlock } | { ok: false; error: string }
> {
  const uploadResult = await uploadProjectBlockFile(projectId, kind, file);
  if (!uploadResult.ok) {
    return uploadResult;
  }

  const project = await getProjectModuleBlocks(projectId);
  if (!project) {
    await deleteModuleBlockFiles([uploadResult.block.storagePath]);
    return { ok: false, error: "Projekts nav atrasts." };
  }

  const updateResult = await updateProjectModuleBlocks({
    id: projectId,
    visualizationBlocks:
      kind === "visualization"
        ? [...project.visualizationBlocks, uploadResult.block]
        : project.visualizationBlocks,
    projectBlocks:
      kind === "project"
        ? [...project.projectBlocks, uploadResult.block]
        : project.projectBlocks,
  });

  if (!updateResult.ok) {
    await deleteModuleBlockFiles([uploadResult.block.storagePath]);
    return updateResult;
  }

  return { ok: true, block: uploadResult.block };
}

export async function removeProjectModuleBlock(
  projectId: string,
  kind: ModuleBlockKind,
  blockId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const project = await getProjectModuleBlocks(projectId);
  if (!project) {
    return { ok: false, error: "Projekts nav atrasts." };
  }

  const blocks =
    kind === "visualization" ? project.visualizationBlocks : project.projectBlocks;
  const block = blocks.find((entry) => entry.id === blockId);

  if (!block) {
    return { ok: false, error: "Bloks nav atrasts." };
  }

  const updateResult = await updateProjectModuleBlocks({
    id: projectId,
    visualizationBlocks:
      kind === "visualization"
        ? project.visualizationBlocks.filter((entry) => entry.id !== blockId)
        : project.visualizationBlocks,
    projectBlocks:
      kind === "project"
        ? project.projectBlocks.filter((entry) => entry.id !== blockId)
        : project.projectBlocks,
  });

  if (!updateResult.ok) {
    return updateResult;
  }

  await deleteModuleBlockFiles([block.storagePath]);
  return { ok: true };
}

