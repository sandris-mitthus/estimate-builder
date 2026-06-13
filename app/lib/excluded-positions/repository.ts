import type {
  CreateExcludedPositionInput,
  ExcludedPosition,
  ExcludedPositionRow,
  ReorderExcludedPositionsInput,
  UpdateExcludedPositionInput,
} from "@/app/lib/excluded-positions/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

function mapRow(row: ExcludedPositionRow): ExcludedPosition {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Ievadi nosaukumu.";
  }
  if (trimmed.length > 500) {
    return "Nosaukums ir pārāk garš.";
  }
  return null;
}

export async function listExcludedPositions(): Promise<ExcludedPosition[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("excluded_positions")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapRow(row as ExcludedPositionRow));
}

export async function createExcludedPosition(
  input: CreateExcludedPositionInput,
): Promise<{ ok: true; position: ExcludedPosition } | { ok: false; error: string }> {
  const nameError = validateName(input.name);
  if (nameError) {
    return { ok: false, error: nameError };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const supabase = createAdminClient();
  const { data: maxRow, error: maxError } = await supabase
    .from("excluded_positions")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxError) {
    return { ok: false, error: "Neizdevās pievienot pozīciju." };
  }

  const nextSortOrder =
    maxRow && typeof (maxRow as ExcludedPositionRow).sort_order === "number"
      ? (maxRow as ExcludedPositionRow).sort_order + 1
      : 0;

  const { data, error } = await supabase
    .from("excluded_positions")
    .insert({
      name: input.name.trim(),
      sort_order: nextSortOrder,
    })
    .select("id, name, sort_order")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās pievienot pozīciju." };
  }

  return { ok: true, position: mapRow(data as ExcludedPositionRow) };
}

export async function updateExcludedPosition(
  input: UpdateExcludedPositionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const nameError = validateName(input.name);
  if (nameError) {
    return { ok: false, error: nameError };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("excluded_positions")
    .update({ name: input.name.trim() })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "Neizdevās atjaunināt pozīciju." };
  }

  return { ok: true };
}

export async function deleteExcludedPosition(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("excluded_positions").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst pozīciju." };
  }

  return { ok: true };
}

export async function reorderExcludedPositions(
  input: ReorderExcludedPositionsInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const orderedIds = input.orderedIds.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );

  if (orderedIds.length === 0) {
    return { ok: true };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const supabase = createAdminClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from("excluded_positions").update({ sort_order: index }).eq("id", id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    return { ok: false, error: "Neizdevās saglabāt secību." };
  }

  return { ok: true };
}
