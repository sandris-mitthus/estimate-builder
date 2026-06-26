"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import {
  createWorker,
  deleteWorker,
  updateWorker,
} from "@/app/lib/workers/repository";
import {
  deleteWorkerPhotoFromStorage,
  uploadWorkerPhoto,
} from "@/app/lib/workers/photo-storage";
import type { CreateWorkerInput, UpdateWorkerInput } from "@/app/lib/workers/types";

function revalidateWorkers() {
  revalidatePath("/workers");
  revalidatePath("/tools");
}

export async function createWorkerAction(input: CreateWorkerInput) {
  const { denied } = await requireAction("workers.manage");
  if (denied) return denied;

  const result = await createWorker(input);

  if (result.ok) {
    revalidateWorkers();
  }

  return result;
}

export async function updateWorkerAction(input: UpdateWorkerInput) {
  const { denied } = await requireAction("workers.manage");
  if (denied) return denied;

  const result = await updateWorker(input);

  if (result.ok) {
    revalidateWorkers();
  }

  return result;
}

export async function deleteWorkerAction(id: string) {
  const { denied } = await requireAction("workers.manage");
  if (denied) return denied;

  const result = await deleteWorker(id);

  if (result.ok) {
    revalidateWorkers();
  }

  return result;
}

export async function uploadWorkerPhotoAction(workerId: string, formData: FormData) {
  const { denied } = await requireAction("workers.manage");
  if (denied) return denied;

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return { ok: false as const, error: "Izvēlies attēlu." };
  }

  const result = await uploadWorkerPhoto(workerId, file);

  if (result.ok) {
    revalidateWorkers();
  }

  return result;
}

export async function removeWorkerPhotoAction(workerId: string) {
  const { denied } = await requireAction("workers.manage");
  if (denied) return denied;

  const result = await deleteWorkerPhotoFromStorage(workerId);

  if (result.ok) {
    revalidateWorkers();
  }

  return result;
}
