"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import {
  createTodoCategory,
  createTodoTask,
  deleteTodoCategory,
  deleteTodoTask,
  reorderTodoCategories,
  reorderTodoTasks,
  updateTodoCategory,
  updateTodoTask,
  type TodoCategoryReorderItem,
  type TodoCategoryInput,
  type TodoTaskInput,
  type TodoTaskReorderItem,
} from "@/app/lib/todo/repository";

const DENIED = { ok: false as const, error: "Nav autorizācijas." };

function revalidateTodoList() {
  revalidatePath("/tasks");
}

async function assertTodoActionAccess() {
  const user = await getCurrentUser();
  if (!user) {
    return DENIED;
  }

  await assertNavAccess("todo");
  return null;
}

export async function createTodoCategoryAction(input: TodoCategoryInput) {
  const denied = await assertTodoActionAccess();
  if (denied) return denied;

  const result = await createTodoCategory(input);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function updateTodoCategoryAction(
  categoryId: string,
  input: TodoCategoryInput,
) {
  const denied = await assertTodoActionAccess();
  if (denied) return denied;

  const result = await updateTodoCategory(categoryId, input);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function deleteTodoCategoryAction(categoryId: string) {
  const denied = await assertTodoActionAccess();
  if (denied) return denied;

  const result = await deleteTodoCategory(categoryId);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function reorderTodoCategoriesAction(items: TodoCategoryReorderItem[]) {
  const denied = await assertTodoActionAccess();
  if (denied) return denied;

  const result = await reorderTodoCategories(items);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function createTodoTaskAction(input: TodoTaskInput) {
  const denied = await assertTodoActionAccess();
  if (denied) return denied;

  const result = await createTodoTask(input);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function updateTodoTaskAction(taskId: string, input: TodoTaskInput) {
  const denied = await assertTodoActionAccess();
  if (denied) return denied;

  const result = await updateTodoTask(taskId, input);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function deleteTodoTaskAction(taskId: string) {
  const denied = await assertTodoActionAccess();
  if (denied) return denied;

  const result = await deleteTodoTask(taskId);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function reorderTodoTasksAction(items: TodoTaskReorderItem[]) {
  const denied = await assertTodoActionAccess();
  if (denied) return denied;

  const result = await reorderTodoTasks(items);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}
