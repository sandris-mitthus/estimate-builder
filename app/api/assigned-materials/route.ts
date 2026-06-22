import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { resolveRelatedUserIds } from "@/app/lib/auth/resolve-related-user-ids";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { listUserAssignedMaterialGroups } from "@/app/lib/projects/list-user-assigned-materials";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { listUsers } from "@/app/lib/users/repository";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const currentUserDisplay = mapUserDisplay(user);
  const [allUsers, catalogPositions] = await Promise.all([
    listUsers(),
    listPositionPrices(),
  ]);
  const currentUserFromList = allUsers.find(
    (listedUser) => listedUser.id === user.id,
  );
  const groups = await listUserAssignedMaterialGroups(user.id, {
    relatedUserIds: resolveRelatedUserIds(
      user.id,
      currentUserFromList?.name ?? currentUserDisplay.name,
      allUsers,
    ),
    allUsers,
    catalogPositions,
  });
  const companySettings =
    groups.length > 0 ? await getCompanySettings() : null;

  return Response.json(
    {
      groups,
      catalogPositions: groups.length > 0 ? catalogPositions : [],
      currency: companySettings?.currency ?? null,
      currentUser: {
        id: user.id,
        name: currentUserDisplay.name,
        email: user.email ?? "",
        avatarUrl: currentUserDisplay.avatarUrl,
        companyStatus: "active",
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
