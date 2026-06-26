export type WorkerSummary = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCallingCode: string;
  photoUrl: string;
  sortOrder: number;
};

export type WorkerRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  phone_calling_code: string;
  photo_path: string | null;
  sort_order: number;
};

export type CreateWorkerInput = {
  firstName: string;
  lastName: string;
  phone: string;
  phoneCallingCode: string;
};

export type UpdateWorkerInput = CreateWorkerInput & {
  id: string;
};

export function formatWorkerName(worker: Pick<WorkerSummary, "firstName" | "lastName">) {
  return `${worker.firstName} ${worker.lastName}`.trim();
}
