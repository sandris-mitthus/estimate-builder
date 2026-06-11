import type { PositionCostType } from "@/app/lib/positions/position-cost-type";

export type PositionPriceSummary = {
  id: string;
  name: string;
  unit: string;
  costType: PositionCostType;
  unitPrice?: number;
  /** ISO datums (YYYY-MM-DD) — kad pēdējo reizi atjaunināta unitPrice */
  unitPriceUpdatedAt?: string;
  supplierName?: string;
  supplierContactName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  /** Kad ieslēgts — apjomu katrā projektā definē atsevišķi tāmes rindā */
  variableQuantity: boolean;
};

export type CreatePositionInput = {
  name: string;
  unit: string;
  costType: PositionCostType;
  variableQuantity?: boolean;
};

export type UpdatePositionInput = CreatePositionInput & {
  id: string;
};

export type UpdatePositionUnitPriceInput = {
  id: string;
  unitPrice: number;
  supplierName: string;
  supplierContactName: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierPhoneCallingCode?: string;
};

export type PositionPriceHistoryEntry = {
  id: string;
  unitPrice: number;
  /** ISO datums (YYYY-MM-DD) */
  recordedAt: string;
  supplierName?: string;
  supplierContactName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
};
