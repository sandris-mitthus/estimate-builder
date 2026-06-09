import type { EstimateCategory } from "@/app/lib/estimates/types";

export type ProjectSummary = {
  id: string;
  name: string;
  address: string;
};

export type EstimateMeta = {
  client: string;
  project: string;
  author: string;
  date: string;
  number: string;
};

export type ProjectEstimate = {
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
};
