import type { NavPermissionKey } from "@/app/lib/auth/permissions";
import { NAV_FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";

export async function isNavAllowedByFrontendModules(
  navKey: NavPermissionKey,
): Promise<boolean> {
  const linkedKey = NAV_FRONTEND_MODULE_KEYS[navKey];
  if (!linkedKey) {
    return true;
  }

  const enabledKeys = await getEnabledFrontendModuleKeys();
  return enabledKeys.has(linkedKey);
}

export async function filterNavKeysByFrontendModules(
  navKeys: NavPermissionKey[],
): Promise<NavPermissionKey[]> {
  const enabledKeys = await getEnabledFrontendModuleKeys();

  return navKeys.filter((navKey) => {
    const linkedKey = NAV_FRONTEND_MODULE_KEYS[navKey];
    if (!linkedKey) {
      return true;
    }

    return enabledKeys.has(linkedKey);
  });
}
