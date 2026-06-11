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
  /** Saite uz `position_prices`, ja rinda no kataloga */
  positionPriceId?: string;
};

export type EstimateMultiPositionOption = {
  id: string;
  lineItem: EstimateLineItem;
};

/** Vairākas izvēles pozīcijas grupa — piedāvājumā izvēlas vienu opciju vai Neviena opcija. */
export type EstimateMultiPosition = {
  id: string;
  kind: "multi";
  name: string;
  options: EstimateMultiPositionOption[];
  /** Projekta tāmē — `null` vai `__none__` = Neviena opcija */
  selectedOptionId?: string | null;
};

/** Saistītu multi opciju grupa — glabājas dokumenta līmenī. */
export type MultiOptionLinkGroup = {
  id: string;
  optionIds: string[];
};

export type EstimateRowItem = EstimateLineItem | EstimateMultiPosition;

export type EstimateSubcategory = {
  id: string;
  title: string;
  items: EstimateRowItem[];
};

export type EstimateCategory = {
  id: string;
  title: string;
  subcategories: EstimateSubcategory[];
  items: EstimateRowItem[];
};

export type EstimateDocument = {
  title: string;
  categories: EstimateCategory[];
};
