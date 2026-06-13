export type PriceBreakdown = {
  labor: number;
  materials: number;
  mechanisms: number;
};

/** Piesaistīts moduļa lielums tāmes rindai (vienlaikus tikai viens slēdzis). */
export type LineItemModuleSizeAttachment = {
  moduleId: string;
  itemKey: string;
  /** Korekcijas (+) pēc summary atslēgas — tikai šai tāmes pozīcijai. */
  adjustments?: Record<string, string>;
};

/** Atsauce uz kataloga pozīciju (materiāls / mehānisms) ar uzglabātu nosaukumu un mērvienību. */
export type LineItemCatalogRef = {
  positionPriceId: string;
  name: string;
  unit: string;
};

export type EstimateLineItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: PriceBreakdown;
  /** Saite uz `position_prices`, ja rinda no kataloga */
  positionPriceId?: string;
  moduleSizeAttachment?: LineItemModuleSizeAttachment;
  /** Laika norma (c/h) — stundas uz vienību; darbs = laika norma × stundas likme. */
  laborTimeNorm?: number;
  /** @deprecated Izmanto `materials` (masīvs). Vecs datu formāts — migrācija notiek `hydrateCompositeLineItem`. */
  material?: LineItemCatalogRef | null;
  /** @deprecated Izmanto `mechanisms` (masīvs). Vecs datu formāts — migrācija notiek `hydrateCompositeLineItem`. */
  mechanism?: LineItemCatalogRef | null;
  /** Piesaistītie materiāli — cenas summējas. */
  materials?: LineItemCatalogRef[];
  /** Piesaistītie mehānismi — katrs: kataloga likme (EUR/h) × laika norma; summējas. */
  mechanisms?: LineItemCatalogRef[];
  /** Ja `true` — apjoms nav saistīts ar moduļa lielumu; katrā projektā ierakstāms manuāli. */
  variableQuantity?: boolean;
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
  /** `true` — subkategorijas pozīcijas paslēptas piedāvājumā. */
  hiddenInOffer?: boolean;
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
