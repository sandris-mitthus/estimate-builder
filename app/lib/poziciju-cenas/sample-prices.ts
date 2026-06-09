export type PositionPriceSummary = {
  id: string;
  name: string;
  unit: string;
};

export const SAMPLE_POSITION_PRICES: PositionPriceSummary[] = [
  {
    id: "price-1",
    name: "Veģetācijas kārtas noņemšana un augsnes izvešana",
    unit: "m³",
  },
  {
    id: "price-2",
    name: "Monolīta dzelzsbetona pamatu liešana",
    unit: "m³",
  },
  {
    id: "price-3",
    name: "Vinila grīdas plāksnes ieklāšana",
    unit: "m²",
  },
  {
    id: "price-4",
    name: "Apgaismes ķermeņu uzstādīšana un pieslēgšana",
    unit: "gab.",
  },
];
