import { normalizeEstimatePositionSection } from "@/app/lib/estimate-positions/create-empty";
import { DEFAULT_SAGATAVE_TITLE } from "@/app/lib/estimate-positions/default-sagatave";
import { getSampleEstimatePosition } from "@/app/lib/estimate-positions/sample-templates";
import {
  buildEstimatePositionSectionsStorage,
  parseEstimatePositionDocumentPayload,
  sanitizeEstimatePositionSections,
} from "@/app/lib/estimate-positions/serialize-document";
import type {
  CreateEstimatePositionInput,
  EstimatePositionDocument,
  EstimatePositionSection,
  SaveEstimatePositionDocumentInput,
} from "@/app/lib/estimate-positions/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type EstimatePositionRow = {
  id: string;
  name: string;
  title: string;
  sections: EstimatePositionSection[] | null;
  created_at: string;
};

function mapDocument(row: EstimatePositionRow): EstimatePositionDocument {
  const parsed = parseEstimatePositionDocumentPayload(row.sections);

  return {
    id: row.id,
    name: row.name,
    title: row.title.trim() || row.name,
    sections: parsed.sections,
    multiOptionLinks: parsed.multiOptionLinks,
    createdAt: row.created_at,
  };
}

export async function ensureDefaultEstimatePosition(): Promise<EstimatePositionDocument> {
  if (!isSupabaseAdminConfigured()) {
    return getSampleEstimatePosition();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimate_positions")
    .select("id, name, title, sections, created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return mapDocument(data as EstimatePositionRow);
  }

  const created = await createEstimatePosition({ name: DEFAULT_SAGATAVE_TITLE });
  if (!created.ok) {
    return getSampleEstimatePosition();
  }

  const document = await getEstimatePosition(created.id);
  return document ?? getSampleEstimatePosition();
}

export async function getEstimatePosition(
  id: string,
): Promise<EstimatePositionDocument | null> {
  if (!isSupabaseAdminConfigured()) {
    return getSampleEstimatePosition();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimate_positions")
    .select("id, name, title, sections, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapDocument(data as EstimatePositionRow);
}

export async function createEstimatePosition(
  input: CreateEstimatePositionInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const name = input.name.trim();

  if (!name) {
    return { ok: false, error: "Ievadi nosaukumu." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimate_positions")
    .insert({
      name,
      title: name,
      sections: [],
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās pievienot tāmes pozīciju." };
  }

  return { ok: true, id: data.id };
}

export async function saveEstimatePositionDocument(
  input: SaveEstimatePositionDocumentInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const title = input.title.trim();

  if (!title) {
    return { ok: false, error: "Ievadi nosaukumu." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const sections = buildEstimatePositionSectionsStorage(
    sanitizeEstimatePositionSections(input.sections),
    input.multiOptionLinks,
  );
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("estimate_positions")
    .update({
      name: title,
      title,
      sections,
    })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt tāmes pozīciju." };
  }

  return { ok: true };
}

