"use server";

import { revalidatePath } from "next/cache";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import {
  createTodoCategory,
  createTodoTask,
  deleteTodoCategory,
  deleteTodoTask,
  reorderTodoTasks,
  updateTodoCategory,
  updateTodoTask,
  type TodoCategoryInput,
  type TodoTaskInput,
  type TodoTaskReorderItem,
} from "@/app/lib/todo/repository";

function revalidateTodoList() {
  revalidatePath("/tasks");
}

export async function createTodoCategoryAction(input: TodoCategoryInput) {
  await assertNavAccess("todo");

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
  await assertNavAccess("todo");

  const result = await updateTodoCategory(categoryId, input);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function deleteTodoCategoryAction(categoryId: string) {
  await assertNavAccess("todo");

  const result = await deleteTodoCategory(categoryId);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function createTodoTaskAction(input: TodoTaskInput) {
  await assertNavAccess("todo");

  const result = await createTodoTask(input);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function updateTodoTaskAction(taskId: string, input: TodoTaskInput) {
  await assertNavAccess("todo");

  const result = await updateTodoTask(taskId, input);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function deleteTodoTaskAction(taskId: string) {
  await assertNavAccess("todo");

  const result = await deleteTodoTask(taskId);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}

export async function reorderTodoTasksAction(items: TodoTaskReorderItem[]) {
  await assertNavAccess("todo");

  const result = await reorderTodoTasks(items);
  if (result.ok) {
    revalidateTodoList();
  }

  return result;
}
