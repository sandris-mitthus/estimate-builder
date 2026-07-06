export type PriceBreakdown = {
  labor: number;
  materials: number;
  mechanisms: number;
};

/** Piesaistīts moduļa lielums tāmes rindai (var piesaistīt vairākus, ja vienāda mērvienība). */
export type LineItemModuleSizeAttachment = {
  moduleId: string;
  /** Pirmā piesaistītā atslēga — atpakaļsaderībai un primārais rādītājs. */
  itemKey: string;
  /** Visas piesaistītās atslēgas; daudzums = to skaitlisko vērtību summa. */
  itemKeys?: string[];
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
  /** `true` — PDF/Excel eksportā rāda tikai gala summu; web tabulā sadalījums paliek redzams (blāvāks). */
  showOnlyTotalPrice?: boolean;
  /** `true` — sagatavē atzīmēta pozīcija, kurai jāpievērš īpaša uzmanība (piem. ierobežots budžets). */
  requiresAttention?: boolean;
  /** Aptuvens budžets, ja `requiresAttention`. */
  attentionBudget?: number;
  /** Projekta tāmē — pozīcija paslēpta no tabulas un kopsummām, bet saglabāta datos. */
  hiddenInEstimate?: boolean;
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
  /** Kopīga piezīme visai multi-pozīcijai. */
  note?: string;
  /** `true` — sagatavē atzīmēta multi-pozīcija ar īpašu uzmanību. */
  requiresAttention?: boolean;
  /** Aptuvens budžets, ja `requiresAttention`. */
  attentionBudget?: number;
  options: EstimateMultiPositionOption[];
  /** Projekta tāmē — `null` vai `__none__` = Neviena opcija */
  selectedOptionId?: string | null;
  /** Projekta tāmē — multi-pozīcija paslēpta no tabulas un kopsummām, bet saglabāta datos. */
  hiddenInEstimate?: boolean;
};

/** Saistītu multi opciju grupa — glabājas dokumenta līmenī. */
export type MultiOptionLinkGroup = {
  id: string;
  optionIds: string[];
};

export type EstimateRowItem = EstimateLineItem | EstimateMultiPosition;

export type EstimateCategoryChildRef =
  | { kind: "subcategory"; id: string }
  | { kind: "item"; id: string };

export type EstimateSubcategory = {
  id: string;
  title: string;
  items: EstimateRowItem[];
  /** `true` — subkategorijas pozīcijas paslēptas piedāvājumā. */
  hiddenInOffer?: boolean;
  /** `true` — subkategorijas pozīciju cenas paslēptas piedāvājumā. */
  hiddenPricesInOffer?: boolean;
  /** Projekta tāmē — subkategorija paslēpta no tabulas un kopsummām, bet saglabāta datos. */
  hiddenInEstimate?: boolean;
};

export type EstimateCategory = {
  id: string;
  title: string;
  subcategories: EstimateSubcategory[];
  items: EstimateRowItem[];
  /** Apakškategoriju un tiešo pozīciju secība kategorijas līmenī. */
  childOrder?: EstimateCategoryChildRef[];
  /** Projekta tāmē — kategorija paslēpta no tabulas un kopsummām, bet saglabāta datos. */
  hiddenInEstimate?: boolean;
};

export type EstimateDocument = {
  title: string;
  categories: EstimateCategory[];
};
