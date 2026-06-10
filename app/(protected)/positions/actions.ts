"use server";

import { revalidatePath } from "next/cache";
import {
  createPositionPrice,
  deletePositionPrice,
  updatePositionPrice,
  updatePositionUnitPrice,
} from "@/app/lib/positions/repository";
import type {
  CreatePositionInput,
  UpdatePositionInput,
  UpdatePositionUnitPriceInput,
} from "@/app/lib/positions/types";

function revalidatePositions() {
  revalidatePath("/positions");
}

export async function createPositionAction(input: CreatePositionInput) {
  const result = await createPositionPrice(input);

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}

export async function updatePositionAction(input: UpdatePositionInput) {
  const result = await updatePositionPrice(input);

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}

export async function updatePositionUnitPriceAction(
  input: UpdatePositionUnitPriceInput,
) {
  const result = await updatePositionUnitPrice(input);

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}

export async function deletePositionAction(id: string) {
  const result = await deletePositionPrice(id);

  if (result.ok) {
    revalidatePositions();
  }

  return result;
}
