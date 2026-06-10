export type PositionPriceSummary = {
  id: string;
  name: string;
  unit: string;
  unitPrice?: number;
  /** ISO datums (YYYY-MM-DD) — kad pēdējo reizi atjaunināta unitPrice */
  unitPriceUpdatedAt?: string;
  supplierName?: string;
  supplierContactName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
};

export type CreatePositionInput = {
  name: string;
  unit: string;
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
