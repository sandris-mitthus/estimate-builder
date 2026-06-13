"use client";

import { createContext, useContext } from "react";
import {
  ACTION_PERMISSION_KEYS,
  createFullPermissions,
  type ActionPermissionKey,
} from "@/app/lib/auth/permissions";

export type ActionPermissions = Record<ActionPermissionKey, boolean>;

const ActionPermissionsContext = createContext<ActionPermissions | null>(null);

const devFallbackActions = createFullPermissions(true).actions;

export function ActionPermissionsProvider({
  actions,
  children,
}: {
  actions: ActionPermissions;
  children: React.ReactNode;
}) {
  return (
    <ActionPermissionsContext.Provider value={actions}>
      {children}
    </ActionPermissionsContext.Provider>
  );
}

export function useActionPermissions(): ActionPermissions {
  const value = useContext(ActionPermissionsContext);
  return value ?? devFallbackActions;
}

export function useActionPermission(key: ActionPermissionKey): boolean {
  return useActionPermissions()[key] === true;
}

export function serializeActionPermissions(
  actions: ActionPermissions,
): ActionPermissions {
  return Object.fromEntries(
    ACTION_PERMISSION_KEYS.map((key) => [key, actions[key] === true]),
  ) as ActionPermissions;
}
