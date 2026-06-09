import type { EstimateCategory } from "@/app/lib/estimates/types";

export type ProjectSummary = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
};

export type CreateProjectInput = {
  clientName: string;
  phone: string;
  email: string;
  address: string;
  phoneCallingCode?: string;
};

export type UpdateProjectInput = CreateProjectInput & {
  id: string;
};

export type EstimateMeta = {
  client: string;
  project: string;
  author: string;
  date: string;
  deadline: string;
  number: string;
};

export type ProjectEstimate = {
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
};
