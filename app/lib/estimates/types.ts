export type PriceBreakdown = {
  labor: number;
  materials: number;
  mechanisms: number;
};

export type EstimateLineItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: PriceBreakdown;
};

export type EstimateSubcategory = {
  id: string;
  title: string;
  items: EstimateLineItem[];
};

export type EstimateCategory = {
  id: string;
  title: string;
  subcategories: EstimateSubcategory[];
  items: EstimateLineItem[];
};

export type EstimateDocument = {
  title: string;
  categories: EstimateCategory[];
};
