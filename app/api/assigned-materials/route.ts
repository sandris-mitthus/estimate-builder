import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { resolveRelatedUserIds } from "@/app/lib/auth/resolve-related-user-ids";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { toEstimateCatalogPositions } from "@/app/lib/positions/estimate-catalog";
import { listPositionPrices } from "@/app/lib/positions/repository";
import {
  listCompanyMaterialAssignments,
  listUserAssignedMaterialGroups,
} from "@/app/lib/projects/list-user-assigned-materials";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { listUsers } from "@/app/lib/users/repository";

const EMPTY_HEADERS = { "Cache-Control": "private, no-store" } as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const currentUserDisplay = mapUserDisplay(user);
  const currentUser = {
    id: user.id,
    name: currentUserDisplay.name,
    email: user.email ?? "",
    avatarUrl: currentUserDisplay.avatarUrl,
    companyStatus: "active" as const,
  };

  if (!(await isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.delegatedOrders))) {
    return Response.json(
      { groups: [], catalogPositions: [], currency: null, currentUser },
      { headers: EMPTY_HEADERS },
    );
  }

  // Gates the banner and supplies the rows the grouping needs, so the
  // assignments table is read once per request instead of twice.
  const assignments = await listCompanyMaterialAssignments();
  if (assignments.length === 0) {
    return Response.json(
      { groups: [], catalogPositions: [], currency: null, currentUser },
      { headers: EMPTY_HEADERS },
    );
  }

  const [allUsers, catalogPositions, companySettings] = await Promise.all([
    listUsers(),
    listPositionPrices(),
    getCompanySettings(),
  ]);
  const currentUserFromList = allUsers.find(
    (listedUser) => listedUser.id === user.id,
  );
  const groups = await listUserAssignedMaterialGroups(user.id, {
    assignments,
    relatedUserIds: resolveRelatedUserIds(
      user.id,
      currentUserFromList?.name ?? currentUserDisplay.name,
      allUsers,
    ),
    allUsers,
    catalogPositions,
  });

  return Response.json(
    {
      groups,
      catalogPositions:
        groups.length > 0 ? toEstimateCatalogPositions(catalogPositions) : [],
      currency: groups.length > 0 ? (companySettings?.currency ?? null) : null,
      currentUser,
    },
    { headers: EMPTY_HEADERS },
  );
}
