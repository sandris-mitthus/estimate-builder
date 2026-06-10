import { todayIsoDate } from "@/app/lib/format-display-date";
import { SAMPLE_POSITION_PRICES } from "@/app/lib/positions/sample-prices";
import type {
  CreatePositionInput,
  PositionPriceSummary,
  UpdatePositionInput,
  UpdatePositionUnitPriceInput,
} from "@/app/lib/positions/types";
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
      "id, name, unit, unit_price, unit_price_updated_at, supplier_name, supplier_contact_name, supplier_email, supplier_phone",
    )
    .order("name", { ascending: true });

  if (error || !data) {
    return SAMPLE_POSITION_PRICES;
  }

  return data.map((row) => mapPositionPrice(row as PositionPriceRow));
}

export async function createPositionPrice(
  input: CreatePositionInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const unit = input.unit.trim();
  const validationError = validatePositionFields(name, unit);

  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("position_prices")
    .insert({ name, unit })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās pievienot pozīciju." };
  }

  return { ok: true, id: data.id };
}

export async function updatePositionPrice(
  input: UpdatePositionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const unit = input.unit.trim();
  const validationError = validatePositionFields(name, unit);

  if (validationError) {
    return { ok: false, error: validationError };
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
  const { error } = await supabase
    .from("position_prices")
    .update({
      unit_price: input.unitPrice,
      unit_price_updated_at: todayIsoDate(),
      supplier_name: input.supplierName.trim(),
      supplier_contact_name: input.supplierContactName.trim(),
      supplier_email: contact.email,
      supplier_phone: contact.phone,
    })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt cenu." };
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
