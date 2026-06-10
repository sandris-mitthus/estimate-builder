"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import { createProject, deleteProject, updateProject, updateProjectEstimateDates } from "@/app/lib/projects/repository";
import type { CreateProjectInput, UpdateProjectInput } from "@/app/lib/projects/types";
import { validateProjectContactFields } from "@/app/lib/validation/contact-fields";

export async function createProjectAction(input: CreateProjectInput) {
  const contact = validateProjectContactFields({
    email: input.email,
    phone: input.phone,
    phoneCallingCode: input.phoneCallingCode ?? DEFAULT_CALLING_CODE,
  });

  if (contact.error) {
    return { ok: false as const, error: contact.error };
  }

  const user = await getCurrentUser();
  const author = user ? mapUserDisplay(user).name : "";

  const result = await createProject(
    {
      ...input,
      email: contact.email,
      phone: contact.phone,
    },
    author,
  );

  if (result.ok) {
    revalidatePath("/");
  }

  return result;
}

export async function updateProjectAction(input: UpdateProjectInput) {
  const contact = validateProjectContactFields({
    email: input.email,
    phone: input.phone,
    phoneCallingCode: input.phoneCallingCode ?? DEFAULT_CALLING_CODE,
  });

  if (contact.error) {
    return { ok: false as const, error: contact.error };
  }

  const result = await updateProject({
    ...input,
    email: contact.email,
    phone: contact.phone,
  });

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/${input.id}`);
  }

  return result;
}

export async function updateProjectEstimateDatesAction(
  projectId: string,
  dates: { date: string; deadline: string },
) {
  const result = await updateProjectEstimateDates(projectId, dates);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
  }

  return result;
}

export async function deleteProjectAction(id: string) {
  const result = await deleteProject(id);

  if (result.ok) {
    revalidatePath("/");
  }

  return result;
}
