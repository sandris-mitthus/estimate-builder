export type ExcludedPosition = {
  id: string;
  name: string;
  sortOrder: number;
};

export type ExcludedPositionRow = {
  id: string;
  name: string;
  sort_order: number;
};

export type CreateExcludedPositionInput = {
  name: string;
};

export type UpdateExcludedPositionInput = {
  id: string;
  name: string;
};

export type ReorderExcludedPositionsInput = {
  orderedIds: string[];
};
