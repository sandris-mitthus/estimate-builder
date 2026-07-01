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
  /**
   * Materiāliem: patēriņš uz vienu patēriņa apjoma mērvienību (piem. t uz vienu m).
   * Mehānismiem: daudzuma koeficients. Nav norādīts = 1.
   */
  consumption?: number;
  /** Materiāliem: cits moduļa apjoms patēriņam (piem. perimetrs m, nevis pozīcijas laukums m²). */
  consumptionVolumeAttachment?: LineItemModuleSizeAttachment;
  /** Materiāliem: rāda patēriņa ievadi arī tad, ja materiāla m.v. sakrīt ar pozīcijas m.v. (piem. 2× siets). */
  manualConsumption?: boolean;
  /** Mehānismiem: izmanto `consumption` kā fiksētu daudzumu, nevis reizina ar laika normu. */
  fixedQuantity?: boolean;
};

export type EstimateLineItem = {
  id: string;
  name: string;
  /** Īsa piezīme — redzama tāmes web skatā zem nosaukuma. */
  note?: string;
  unit: string;
  quantity: number;
  unitPrice: PriceBreakdown;
  /** Saite uz `position_prices`, ja rinda no kataloga */
  positionPriceId?: string;
  moduleSizeAttachment?: LineItemModuleSizeAttachment;
  /** Laika norma (c/h) — stundas uz vienību; darbs = laika norma × stundas likme. */
  laborTimeNorm?: number;
  /** Ja `true` — darba aprēķinam izmanto pozīcijas individuālo stundas likmi. */
  customHourlyRateEnabled?: boolean;
  /** Individuālā stundas likme, kad `customHourlyRateEnabled`. */
  customHourlyRate?: number;
  /** @deprecated Izmanto `materials` (masīvs). Vecs datu formāts — migrācija notiek `hydrateCompositeLineItem`. */
  material?: LineItemCatalogRef | null;
  /** @deprecated Izmanto `mechanisms` (masīvs). Vecs datu formāts — migrācija notiek `hydrateCompositeLineItem`. */
  mechanism?: LineItemCatalogRef | null;
  /** Piesaistītie materiāli — cenas summējas. */
  materials?: LineItemCatalogRef[];
  /** Piesaistītie mehānismi — pēc noklusējuma kataloga likme × laika norma; fiksētiem mehānismiem likme × ievadītais daudzums. */
  mechanisms?: LineItemCatalogRef[];
  /** Ja `true` — apjoms nav saistīts ar moduļa lielumu; katrā projektā ierakstāms manuāli. */
  variableQuantity?: boolean;
  /** Ja `true` — mērvienību norāda manuāli (ne tikai no moduļa apjoma). */
  manualUnitEnabled?: boolean;
  /** Manuāli norādītā mērvienība, kad `manualUnitEnabled`. */
  manualUnit?: string;
  /** `true` — pozīcijas cena paslēpta piedāvājumā (tikai kategorijas līmeņa pozīcijām). */
  hiddenPriceInOffer?: boolean;
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
  /** `true` — subkategorijas pozīciju cenas paslēptas piedāvājumā. */
  hiddenPricesInOffer?: boolean;
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
