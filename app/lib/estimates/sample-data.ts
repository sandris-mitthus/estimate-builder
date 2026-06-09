import type { EstimateCategory } from "@/app/lib/estimates/types";

export const SAMPLE_TITLE = "Biroja ēkas 1. stāva renovācija";

export const SAMPLE_META = {
  client: "SIA \"Nordic Build\"",
  project: "Biroja telpu pārbūve — 248 m²",
  author: "Jānis Bērziņš",
  date: "2026-06-09",
  number: "T-2026/014",
};

export function createSampleCategories(): EstimateCategory[] {
  return [
    {
      id: "cat-1",
      title: "1. Zemju un pamatu darbi",
      subcategories: [
        {
          id: "sub-1-1",
          title: "Grunts sagatavošana",
          items: [
            {
              id: "item-1-1-1",
              name: "Veģetācijas kārtas noņemšana un augsnes izvešana",
              unit: "m³",
              quantity: 18.5,
              unitPrice: { labor: 4.2, materials: 0.8, mechanisms: 12.5 },
            },
            {
              id: "item-1-1-2",
              name: "Grunts blietināšana ar vibrācijas iekārtām",
              unit: "m²",
              quantity: 62,
              unitPrice: { labor: 1.85, materials: 0.35, mechanisms: 3.2 },
            },
          ],
        },
      ],
      items: [
        {
          id: "item-1-2",
          name: "Smilšūdens urbumi un spridināšana",
          unit: "m",
          quantity: 24,
          unitPrice: { labor: 18.5, materials: 6.2, mechanisms: 42 },
        },
      ],
    },
    {
      id: "cat-2",
      title: "2. Konstruktīvie betona un monolīta darbi",
      subcategories: [],
      items: [
        {
          id: "item-2-1",
          name: "Monolīta dzelzsbetona sijas C25/30",
          unit: "m³",
          quantity: 4.8,
          unitPrice: { labor: 85, materials: 142, mechanisms: 28 },
        },
        {
          id: "item-2-2",
          name: "Monolīta dzelzsbetona pārsegums C25/30",
          unit: "m³",
          quantity: 12.3,
          unitPrice: { labor: 78, materials: 138, mechanisms: 24 },
        },
        {
          id: "item-2-3",
          name: "Dzelzsbetona stiegrojums A500C",
          unit: "t",
          quantity: 1.42,
          unitPrice: { labor: 320, materials: 980, mechanisms: 45 },
        },
      ],
    },
    {
      id: "cat-3",
      title: "3. Apdares un inženierkomunikāciju darbi",
      subcategories: [
        {
          id: "sub-3-1",
          title: "Grīdu un sienu apdare",
          items: [
            {
              id: "item-3-1-1",
              name: "Vinila grīdas plāksnes uz līdzenināšanas slāņa",
              unit: "m²",
              quantity: 248,
              unitPrice: { labor: 8.5, materials: 22.4, mechanisms: 1.2 },
            },
            {
              id: "item-3-1-2",
              name: "Gipskartonniešu karkasa sienas ar akmensvates izolāciju",
              unit: "m²",
              quantity: 96,
              unitPrice: { labor: 14.8, materials: 18.6, mechanisms: 2.4 },
            },
          ],
        },
        {
          id: "sub-3-2",
          title: "Elektroinstalācija",
          items: [
            {
              id: "item-3-2-1",
              name: "Elektroinstalācijas kabeļu ielikšana zem grīdas",
              unit: "m",
              quantity: 420,
              unitPrice: { labor: 3.2, materials: 4.8, mechanisms: 0.6 },
            },
            {
              id: "item-3-2-2",
              name: "Apgaismes ķermeņu uzstādīšana un pieslēgšana",
              unit: "gab.",
              quantity: 64,
              unitPrice: { labor: 12.5, materials: 8.2, mechanisms: 0 },
            },
          ],
        },
      ],
      items: [
        {
          id: "item-3-3",
          name: "Biroja telpu galīgā uzkopšana pirms nodošanas",
          unit: "m²",
          quantity: 248,
          unitPrice: { labor: 1.4, materials: 0.35, mechanisms: 0.15 },
        },
      ],
    },
  ];
}
