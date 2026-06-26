import type { NavPermissionKey } from "@/app/lib/auth/permissions";

export const FRONTEND_MODULE_KEYS = {
  todoList: "module_todo_list",
} as const;

export type FrontendModuleKey =
  (typeof FRONTEND_MODULE_KEYS)[keyof typeof FRONTEND_MODULE_KEYS];

/** Nav permission keys gated by a frontend module (non–system-admin users). */
export const NAV_FRONTEND_MODULE_KEYS: Partial<
  Record<NavPermissionKey, FrontendModuleKey>
> = {
  todo: FRONTEND_MODULE_KEYS.todoList,
};
