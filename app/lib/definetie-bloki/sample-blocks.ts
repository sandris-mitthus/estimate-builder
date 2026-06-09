export type DefinedBlockSummary = {
  id: string;
  name: string;
  description: string;
};

export const SAMPLE_DEFINED_BLOCKS: DefinedBlockSummary[] = [
  {
    id: "block-1",
    name: "Grīdu sagatavošanas komplekts",
    description: "Standarta bloks grīdu sagatavošanas darbiem",
  },
  {
    id: "block-2",
    name: "Elektroinstalācijas pamatkomplekts",
    description: "Kabeļu ielikšana, rozetes, apgaismojums",
  },
  {
    id: "block-3",
    name: "Fasādes apdares bloks",
    description: "Ventilējama fasāde ar minerālvilni",
  },
  {
    id: "block-4",
    name: "Ūdensapgādes un kanalizācijas bloks",
    description: "Iekšējie tīkli un sanitārtehnika",
  },
];
