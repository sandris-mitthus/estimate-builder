import type {
  EstimateCategory,
  MultiOptionLinkGroup,
} from "@/app/lib/estimates/types";

/** Viena tāmes pozīcija bibliotēkā — tāda pati struktūra kā projekta tāmes kategorija. */
export type EstimatePositionSection = EstimateCategory;

export type EstimatePositionSummary = {
  id: string;
  name: string;
  title: string;
  sectionCount: number;
  lineItemCount: number;
  createdAt: string;
};

export type EstimatePositionDocument = {
  id: string;
  name: string;
  title: string;
  sections: EstimatePositionSection[];
  multiOptionLinks: MultiOptionLinkGroup[];
  createdAt: string;
};
export type CreateEstimatePositionInput = {
  name: string;
};

export type SaveEstimatePositionDocumentInput = {
  id: string;
  title: string;
  sections: EstimatePositionSection[];
  multiOptionLinks: MultiOptionLinkGroup[];
};
