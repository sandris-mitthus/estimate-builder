export type ModuleSizeSummaryItem = {
  key: string;
  label: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
  /** Tikai tiešie ievades lielumi — korekcija neietekmē citas rindas. */
  adjustable: boolean;
};

export type ModuleSizeSummarySection = {
  title: string;
  items: ModuleSizeSummaryItem[];
};
