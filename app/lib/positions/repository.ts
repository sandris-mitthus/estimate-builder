import { todayIsoDate } from "@/app/lib/format-display-date";
import { SAMPLE_POSITION_PRICES } from "@/app/lib/positions/sample-prices";
import type {
  CreatePositionInput,
  PositionPriceHistoryEntry,
  PositionPriceSummary,
  UpdatePositionInput,
  UpdatePositionUnitPriceInput,
} from "@/app/lib/positions/types";
import { normalizePositionCostType } from "@/app/lib/positions/position-cost-type";
import { validatePositionFields } from "@/app/lib/positions/validate-position-fields";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { validateProjectContactFields } from "@/app/lib/validation/contact-fields";

type PositionPriceRow = {
  id: string;
  name: string;
  unit: string;
  unit_price: number | string | null;
  unit_price_updated_at: string | null;
  supplier_name?: string | null;
  supplier_contact_name?: string | null;
  supplier_email?: string | null;
  supplier_phone?: string | null;
  cost_type?: string | null;
  variable_quantity?: boolean | null;
};

function mapPositionPrice(row: PositionPriceRow): PositionPriceSummary {
  const unitPrice =
    row.unit_price === null || row.unit_price === undefined
      ? undefined
      : Number(row.unit_price);

  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : undefined,
    unitPriceUpdatedAt: row.unit_price_updated_at ?? undefined,
    supplierName: row.supplier_name?.trim() || undefined,
    supplierContactName: row.supplier_contact_name?.trim() || undefined,
    supplierEmail: row.supplier_email?.trim() || undefined,
    supplierPhone: row.supplier_phone?.trim() || undefined,
    costType: normalizePositionCostType(row.cost_type) ?? "labor",
    variableQuantity: row.variable_quantity === true,
  };
}

export async function listPositionPrices(): Promise<PositionPriceSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_POSITION_PRICES;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("position_prices")
    .select(
      "id, name, unit, cost_type, unit_price, unit_price_updated_at, supplier_name, supplier_contact_name, supplier_email, supplier_phone, variable_quantity",
    )
    .order("name", { ascending: true });

  if (error || !data) {
    return SAMPLE_POSITION_PRICES;
  }

  const positions = data.map((row) => mapPositionPrice(row as PositionPriceRow));
  return enrichPositionPricesWithLatestHistory(positions);
}

async function enrichPositionPricesWithLatestHistory(
  positions: PositionPriceSummary[],
): Promise<PositionPriceSummary[]> {
  const missingPriceIds = positions
    .filter((position) => position.unitPrice === undefined)
    .map((position) => position.id);

  if (missingPriceIds.length === 0) {
    return positions;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("position_price_history")
    .select("position_price_id, unit_price, recorded_at, created_at")
    .in("position_price_id", missingPriceIds)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return positions;
  }

  const latestPriceByPositionId = new Map<string, number>();

  for (const row of data) {
    const positionId = row.position_price_id as string;
    if (latestPriceByPositionId.has(positionId)) {
      continue;
    }

    const price = Number(row.unit_price);
    if (Number.isFinite(price)) {
      latestPriceByPositionId.set(positionId, price);
    }
  }

  return positions.map((position) => {
    const latestPrice = latestPriceByPositionId.get(position.id);
    if (position.unitPrice !== undefined || latestPrice === undefined) {
      return position;
    }

    return {
      ...position,
      unitPrice: latestPrice,
    };
  });
}

type PositionPriceHistoryRow = {
  id: string;
  unit_price: number | string;
  recorded_at: string;
  supplier_name?: string | null;
  supplier_contact_name?: string | null;
  supplier_email?: string | null;
  supplier_phone?: string | null;
};

function mapPositionPriceHistory(
  row: PositionPriceHistoryRow,
): PositionPriceHistoryEntry {
  return {
    id: row.id,
    unitPrice: Number(row.unit_price),
    recordedAt: row.recorded_at,
    supplierName: row.supplier_name?.trim() || undefined,
    supplierContactName: row.supplier_contact_name?.trim() || undefined,
    supplierEmail: row.supplier_email?.trim() || undefined,
    supplierPhone: row.supplier_phone?.trim() || undefined,
  };
}

export async function listPositionPriceHistory(
  positionPriceId: string,
): Promise<PositionPriceHistoryEntry[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("position_price_history")
    .select(
      "id, unit_price, recorded_at, supplier_name, supplier_contact_name, supplier_email, supplier_phone",
    )
    .eq("position_price_id", positionPriceId)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapPositionPriceHistory(row as PositionPriceHistoryRow));
}

export async function createPositionPrice(
  input: CreatePositionInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const unit = input.unit.trim();
  const costType = normalizePositionCostType(input.costType);
  const validationError = validatePositionFields(name, unit, costType ?? "");

  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("position_prices")
    .insert({
      name,
      unit,
      cost_type: costType,
      variable_quantity: input.variableQuantity === true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās pievienot pozīciju." };
  }

  return { ok: true, id: data.id };
}

export async function updatePositionNameAndUnit(input: {
  id: string;
  name: string;
  unit: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const unit = input.unit.trim();

  if (!name) {
    return { ok: false, error: "Ievadi nosaukumu." };
  }

  if (!unit) {
    return { ok: false, error: "Ievadi mērvienību." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("position_prices")
    .update({ name, unit })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt pozīciju." };
  }

  return { ok: true };
}

export async function updatePositionPrice(
  input: UpdatePositionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const unit = input.unit.trim();
  const costType = normalizePositionCostType(input.costType);
  const validationError = validatePositionFields(name, unit, costType ?? "");

  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("position_prices")
    .update({
      name,
      unit,
      cost_type: costType,
      variable_quantity: input.variableQuantity === true,
    })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt pozīciju." };
  }

  return { ok: true };
}

export async function updatePositionUnitPrice(
  input: UpdatePositionUnitPriceInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    return { ok: false, error: "Ievadi derīgu cenu par 1 mērvienību." };
  }

  const contact = validateProjectContactFields({
    email: input.supplierEmail,
    phone: input.supplierPhone,
    phoneCallingCode: input.supplierPhoneCallingCode ?? DEFAULT_CALLING_CODE,
  });

  if (contact.error) {
    return { ok: false, error: contact.error };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const recordedAt = todayIsoDate();
  const supplierName = input.supplierName.trim();
  const supplierContactName = input.supplierContactName.trim();
  const { error } = await supabase
    .from("position_prices")
    .update({
      unit_price: input.unitPrice,
      unit_price_updated_at: recordedAt,
      supplier_name: supplierName,
      supplier_contact_name: supplierContactName,
      supplier_email: contact.email,
      supplier_phone: contact.phone,
    })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt cenu." };
  }

  const { error: historyError } = await supabase
    .from("position_price_history")
    .insert({
      position_price_id: input.id,
      unit_price: input.unitPrice,
      recorded_at: recordedAt,
      supplier_name: supplierName,
      supplier_contact_name: supplierContactName,
      supplier_email: contact.email,
      supplier_phone: contact.phone,
    });

  if (historyError) {
    return { ok: false, error: "Neizdevās saglabāt cenu vēsturē." };
  }

  return { ok: true };
}

export async function deletePositionPrice(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("position_prices").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst pozīciju." };
  }

  return { ok: true };
}
