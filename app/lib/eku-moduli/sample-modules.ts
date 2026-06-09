export type BuildingModuleSummary = {
  id: string;
  name: string;
  address: string;
};

export const SAMPLE_BUILDING_MODULES: BuildingModuleSummary[] = [
  {
    id: "mod-1",
    name: "Biroja ēka — tips A",
    address: "Standarta 3 stāvu biroja modulis, 420 m²",
  },
  {
    id: "mod-2",
    name: "Noliktavas modulis — tips B",
    address: "Viena līmeņa noliktava ar rampu, 680 m²",
  },
  {
    id: "mod-3",
    name: "Dzīvojamā ēka — tips C",
    address: "Divu dzīvokļu modulis, 186 m²",
  },
];
