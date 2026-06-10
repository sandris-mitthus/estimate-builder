import type { ModuleOutline } from "@/app/lib/modules/types";

export const SAMPLE_MODULE_OUTLINES: Record<string, ModuleOutline> = {
  "mod-1": [
    {
      id: "mod-cat-1",
      title: "1. Konstruktīvie un ēkas karkassa darbi",
      subcategories: [
        { id: "mod-sub-1-1", title: "Pamatu un nulles līmeņa darbi" },
        { id: "mod-sub-1-2", title: "Monolīta karkassa elementi" },
      ],
    },
    {
      id: "mod-cat-2",
      title: "2. Fasādes un jumta konstrukcijas",
      subcategories: [
        { id: "mod-sub-2-1", title: "Ārējā fasādes apdare" },
        { id: "mod-sub-2-2", title: "Jumta segums un liekņi" },
      ],
    },
    {
      id: "mod-cat-3",
      title: "3. Būvniecības iekšdarbi",
      subcategories: [
        { id: "mod-sub-3-1", title: "Grīdu un sienu apdare" },
        { id: "mod-sub-3-2", title: "Elektroinstalācija un apgaismojums" },
      ],
    },
  ],
  "mod-2": [
    {
      id: "mod-cat-1",
      title: "1. Teritorijas un pamatu sagatavošana",
      subcategories: [
        { id: "mod-sub-1-1", title: "Grunts blietināšana un plātnes" },
        { id: "mod-sub-1-2", title: "Betona pamatu liešana" },
      ],
    },
    {
      id: "mod-cat-2",
      title: "2. Metāla karkass un ārējās konstrukcijas",
      subcategories: [
        { id: "mod-sub-2-1", title: "Tērauda karkassa montāža" },
        { id: "mod-sub-2-2", title: "Fasādes paneļi un vārti" },
      ],
    },
    {
      id: "mod-cat-3",
      title: "3. Inženierkomunikācijas",
      subcategories: [
        { id: "mod-sub-3-1", title: "Apkure un ventilācija" },
        { id: "mod-sub-3-2", title: "Elektroinstalācija un apgaismojums" },
      ],
    },
  ],
  "mod-3": [
    {
      id: "mod-cat-1",
      title: "1. Pamatu un karkassa darbi",
      subcategories: [
        { id: "mod-sub-1-1", title: "Lento pamati un stīpas" },
        { id: "mod-sub-1-2", title: "Sienu un pārsegumu montāža" },
      ],
    },
    {
      id: "mod-cat-2",
      title: "2. Jumta un fasādes darbi",
      subcategories: [
        { id: "mod-sub-2-1", title: "Jumta konstrukcijas un segums" },
        { id: "mod-sub-2-2", title: "Fasādes apdare un logi" },
      ],
    },
    {
      id: "mod-cat-3",
      title: "3. Iekštelpu apdare",
      subcategories: [
        { id: "mod-sub-3-1", title: "Grīdas un sienu apdare" },
        { id: "mod-sub-3-2", title: "Santehnika un elektroinstalācija" },
      ],
    },
  ],
};
