import type { PositionPriceSummary } from "@/app/lib/positions/types";

export type { PositionPriceSummary } from "@/app/lib/positions/types";

export const SAMPLE_POSITION_PRICES: PositionPriceSummary[] = [
  {
    id: "price-1",
    name: "Veģetācijas kārtas noņemšana un augsnes izvešana",
    unit: "m³",
    costType: "labor",
    variableQuantity: false,
  },
  {
    id: "price-2",
    name: "Monolīta dzelzsbetona pamatu liešana",
    unit: "m³",
    costType: "labor",
    variableQuantity: false,
  },
  {
    id: "price-3",
    name: "Vinila grīdas plāksnes ieklāšana",
    unit: "m²",
    costType: "materials",
    unitPrice: 18.5,
    variableQuantity: false,
  },
  {
    id: "price-4",
    name: "Apgaismes ķermeņu uzstādīšana un pieslēgšana",
    unit: "gab.",
    costType: "mechanisms",
    unitPrice: 42,
    variableQuantity: false,
  },
];
