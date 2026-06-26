export type ToolPriceType = "purchase" | "amortization";

export type ToolSummary = {
  id: string;
  toolNumber: string;
  name: string;
  purchaseDate: string | null;
  price: number | null;
  priceType: ToolPriceType;
  assignedWorkerId: string | null;
  assignedWorkerName: string | null;
  sortOrder: number;
};

export type ToolRow = {
  id: string;
  tool_number: string;
  name: string;
  purchase_date: string | null;
  price: number | string | null;
  price_type: string;
  assigned_worker_id: string | null;
  sort_order: number;
  company_workers?: {
    first_name: string;
    last_name: string;
  } | {
    first_name: string;
    last_name: string;
  }[] | null;
};

export type CreateToolInput = {
  toolNumber: string;
  name: string;
  purchaseDate: string;
  price: string;
  priceType: ToolPriceType;
  assignedWorkerId: string | null;
};

export type UpdateToolInput = CreateToolInput & {
  id: string;
};
