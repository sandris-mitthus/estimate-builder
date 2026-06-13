import { ActionPermissionsProvider } from "@/app/components/action-permissions-context";
import { AppNav } from "@/app/components/app-nav";
import { AssignedMaterialsBanner } from "@/app/components/assigned-materials-banner";
import { LoginGate } from "@/app/components/login-gate";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { resolveRelatedUserIds } from "@/app/lib/auth/resolve-related-user-ids";
import { getCurrentUserAccess } from "@/app/lib/auth/require-permission";
import { createFullPermissions } from "@/app/lib/auth/permissions";
import { listUserAssignedMaterialGroups } from "@/app/lib/projects/list-user-assigned-materials";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { listUsers } from "@/app/lib/users/repository";
import type { NavPermissionKey } from "@/app/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let currentUser = null;
  let currentUserId: string | null = null;
  let allowedNavKeys: NavPermissionKey[] | null = null;
  let assignedMaterialGroups: Awaited<
    ReturnType<typeof listUserAssignedMaterialGroups>
  > = [];
  let catalogPositions: Awaited<ReturnType<typeof listPositionPrices>> = [];
  let currency: string | null = null;
  let actionPermissions = createFullPermissions(true).actions;

  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (!user) {
      return <LoginGate />;
    }

    const currentUserDisplay = mapUserDisplay(user);
    currentUser = currentUserDisplay;
    currentUserId = user.id;

    const session = await getCurrentUserAccess();
    if (session) {
      actionPermissions = session.access.permissions.actions;
      const navKeys = Object.entries(session.access.permissions.nav)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key as NavPermissionKey);
      allowedNavKeys = navKeys.length > 0 ? navKeys : null;
    }

    const [allUsers, positions, companySettings] = await Promise.all([
      listUsers(),
      listPositionPrices(),
      getCompanySettings(),
    ]);
    const relatedUserIds = resolveRelatedUserIds(
      user.id,
      currentUserDisplay.name,
      allUsers,
    );
    const groups = await listUserAssignedMaterialGroups(user.id, {
      relatedUserIds,
    });

    assignedMaterialGroups = groups;
    catalogPositions = positions;
    currency = companySettings.currency;
  } else if (process.env.NODE_ENV === "production") {
    return <LoginGate />;
  }

  return (
    <ActionPermissionsProvider actions={actionPermissions}>
      <AppNav currentUser={currentUser} allowedNavKeys={allowedNavKeys} />
      {currentUser && currentUserId && assignedMaterialGroups.length > 0 ? (
        <AssignedMaterialsBanner
          groups={assignedMaterialGroups}
          catalogPositions={catalogPositions}
          currency={currency}
          currentUser={{
            id: currentUserId,
            name: currentUser.name,
            email: "",
            avatarUrl: currentUser.avatarUrl,
          }}
        />
      ) : null}
      {children}
    </ActionPermissionsProvider>
  );
}
