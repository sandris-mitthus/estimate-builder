import type { NavPermissionKey } from "@/app/lib/auth/permissions";

export const FRONTEND_MODULE_KEYS = {
  todoList: "module_todo_list",
  workers: "module_workers",
  tools: "module_tools",
  timelineGraph: "module_timeline_graph",
  additionalWork: "module_additional_work",
  profit: "module_profit",
  delegatedOrders: "module_delegated_orders",
} as const;

export type FrontendModuleKey =
  (typeof FRONTEND_MODULE_KEYS)[keyof typeof FRONTEND_MODULE_KEYS];

/** Nav permission keys gated by a frontend module (non–system-admin users). */
export const NAV_FRONTEND_MODULE_KEYS: Partial<
  Record<NavPermissionKey, FrontendModuleKey>
> = {
  todo: FRONTEND_MODULE_KEYS.todoList,
  workers: FRONTEND_MODULE_KEYS.workers,
  tools: FRONTEND_MODULE_KEYS.tools,
  timeline_graph: FRONTEND_MODULE_KEYS.timelineGraph,
};
