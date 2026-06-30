import { cache } from "react";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import type {
  AssignToolWorkerInput,
  CreateToolInput,
  ToolAssignmentHistoryEntry,
  ToolAssignmentHistoryRow,
  ToolPriceType,
  ToolRow,
  ToolSummary,
  UpdateToolInput,
} from "@/app/lib/tools/types";

function normalizePriceType(value: unknown): ToolPriceType {
  return value === "amortization" ? "amortization" : "purchase";
}

function resolveAssignedWorkerName(
  worker: ToolRow["company_workers"],
): string | null {
  if (!worker) return null;

  const record = Array.isArray(worker) ? worker[0] : worker;
  if (!record) return null;

  return `${record.first_name} ${record.last_name}`.trim();
}

function mapTool(row: ToolRow): ToolSummary {
  const price =
    row.price === null || row.price === undefined
      ? null
      : Number(row.price);

  return {
    id: row.id,
    toolNumber: row.tool_number,
    name: row.name,
    purchaseDate: row.purchase_date,
    price: Number.isFinite(price) ? price : null,
    priceType: normalizePriceType(row.price_type),
    assignedWorkerId: row.assigned_worker_id,
    assignedWorkerName: resolveAssignedWorkerName(row.company_workers),
    assignmentHistory: [],
    sortOrder: row.sort_order,
  };
}

function validateToolFields(input: CreateToolInput): string | null {
  if (!input.toolNumber.trim()) {
    return "Ievadi instrumenta numuru.";
  }
  if (!input.name.trim()) {
    return "Ievadi instrumenta nosaukumu.";
  }

  if (input.price.trim()) {
    const parsed = Number(input.price.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return "Ievadi derīgu cenu.";
    }
  }

  return null;
}

function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

const TOOL_SELECT =
  "id, tool_number, name, purchase_date, price, price_type, assigned_worker_id, sort_order, company_workers (first_name, last_name)";

function mapToolAssignmentHistory(
  row: ToolAssignmentHistoryRow,
): ToolAssignmentHistoryEntry {
  return {
    id: row.id,
    toolId: row.tool_id,
    workerId: row.worker_id,
    workerName: row.worker_name,
    assignedAt: row.assigned_at,
  };
}

async function getWorkerName(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  workerId: string,
) {
  const { data } = await supabase
    .from("company_workers")
    .select("first_name, last_name")
    .eq("company_id", companyId)
    .eq("id", workerId)
    .maybeSingle();

  if (!data) return null;

  const worker = data as { first_name: string; last_name: string };
  return `${worker.first_name} ${worker.last_name}`.trim();
}

async function recordToolAssignmentHistory(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  toolId: string,
  workerId: string | null,
): Promise<ToolAssignmentHistoryEntry | null> {
  if (!workerId) return null;

  const workerName = await getWorkerName(supabase, companyId, workerId);
  if (!workerName) return null;

  const { data } = await supabase
    .from("company_tool_assignment_history")
    .insert({
      company_id: companyId,
      tool_id: toolId,
      worker_id: workerId,
      worker_name: workerName,
    })
    .select("id, tool_id, worker_id, worker_name, assigned_at")
    .single();

  if (!data) return null;

  return mapToolAssignmentHistory(data as unknown as ToolAssignmentHistoryRow);
}

export const listTools = cache(async function listTools(): Promise<ToolSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_tools")
    .select(TOOL_SELECT)
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true })
    .order("tool_number", { ascending: true });

  if (error || !data) {
    return [];
  }

  const tools = data.map((row) => mapTool(row as unknown as ToolRow));
  const toolIds = tools.map((tool) => tool.id);

  if (toolIds.length === 0) {
    return tools;
  }

  const { data: historyData } = await supabase
    .from("company_tool_assignment_history")
    .select("id, tool_id, worker_id, worker_name, assigned_at")
    .eq("company_id", companyId)
    .in("tool_id", toolIds)
    .order("assigned_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (!historyData?.length) {
    return tools;
  }

  const historyByToolId = new Map<string, ToolAssignmentHistoryEntry[]>();
  for (const row of historyData) {
    const entry = mapToolAssignmentHistory(
      row as unknown as ToolAssignmentHistoryRow,
    );
    historyByToolId.set(entry.toolId, [
      ...(historyByToolId.get(entry.toolId) ?? []),
      entry,
    ]);
  }

  return tools.map((tool) => ({
    ...tool,
    assignmentHistory: historyByToolId.get(tool.id) ?? [],
  }));
});

export async function createTool(
  input: CreateToolInput,
): Promise<{ ok: true; tool: ToolSummary } | { ok: false; error: string }> {
  const validationError = validateToolFields(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data: maxRow } = await supabase
    .from("company_tools")
    .select("sort_order")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder =
    maxRow && typeof (maxRow as ToolRow).sort_order === "number"
      ? (maxRow as ToolRow).sort_order + 1
      : 0;

  const purchaseDate = input.purchaseDate.trim() || null;

  const { data, error } = await supabase
    .from("company_tools")
    .insert({
      company_id: companyId,
      tool_number: input.toolNumber.trim(),
      name: input.name.trim(),
      purchase_date: purchaseDate,
      price: parsePrice(input.price),
      price_type: input.priceType,
      assigned_worker_id: input.assignedWorkerId,
      sort_order: nextSortOrder,
    })
    .select(TOOL_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Instruments ar šo numuru jau eksistē." };
    }
    return { ok: false, error: "Neizdevās pievienot instrumentu." };
  }

  if (!data) {
    return { ok: false, error: "Neizdevās pievienot instrumentu." };
  }

  return { ok: true, tool: mapTool(data as unknown as ToolRow) };
}

export async function updateTool(
  input: UpdateToolInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validationError = validateToolFields(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const purchaseDate = input.purchaseDate.trim() || null;
  const { data: existingTool } = await supabase
    .from("company_tools")
    .select("assigned_worker_id")
    .eq("id", input.id)
    .eq("company_id", companyId)
    .maybeSingle();

  const previousWorkerId =
    (existingTool as { assigned_worker_id?: string | null } | null)
      ?.assigned_worker_id ?? null;

  const { error } = await supabase
    .from("company_tools")
    .update({
      tool_number: input.toolNumber.trim(),
      name: input.name.trim(),
      purchase_date: purchaseDate,
      price: parsePrice(input.price),
      price_type: input.priceType,
      assigned_worker_id: input.assignedWorkerId,
    })
    .eq("id", input.id)
    .eq("company_id", companyId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Instruments ar šo numuru jau eksistē." };
    }
    return { ok: false, error: "Neizdevās saglabāt instrumentu." };
  }

  if (input.assignedWorkerId !== previousWorkerId) {
    await recordToolAssignmentHistory(
      supabase,
      companyId,
      input.id,
      input.assignedWorkerId,
    );
  }

  return { ok: true };
}

export async function assignToolWorker(
  input: AssignToolWorkerInput,
): Promise<
  | { ok: true; historyEntry: ToolAssignmentHistoryEntry | null }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data: existingTool } = await supabase
    .from("company_tools")
    .select("assigned_worker_id")
    .eq("id", input.toolId)
    .eq("company_id", companyId)
    .maybeSingle();

  const previousWorkerId =
    (existingTool as { assigned_worker_id?: string | null } | null)
      ?.assigned_worker_id ?? null;

  if (previousWorkerId === input.workerId) {
    return { ok: true, historyEntry: null };
  }

  const { error } = await supabase
    .from("company_tools")
    .update({ assigned_worker_id: input.workerId })
    .eq("id", input.toolId)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt instrumentu." };
  }

  const historyEntry = await recordToolAssignmentHistory(
    supabase,
    companyId,
    input.toolId,
    input.workerId,
  );

  return { ok: true, historyEntry };
}

export async function listToolAssignmentHistory(
  toolId: string,
): Promise<
  | { ok: true; history: ToolAssignmentHistoryEntry[] }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_tool_assignment_history")
    .select("id, tool_id, worker_id, worker_name, assigned_at")
    .eq("company_id", companyId)
    .eq("tool_id", toolId)
    .order("assigned_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { ok: false, error: "Neizdevās ielādēt instrumenta vēsturi." };
  }

  return {
    ok: true,
    history: data.map((row) =>
      mapToolAssignmentHistory(row as unknown as ToolAssignmentHistoryRow),
    ),
  };
}

export async function deleteTool(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("company_tools")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst instrumentu." };
  }

  return { ok: true };
}
