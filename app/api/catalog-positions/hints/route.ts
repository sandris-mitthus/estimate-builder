import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUserAccess } from "@/app/lib/auth/require-permission";
import { listPositionPricesForHints } from "@/app/lib/positions/repository";
import { canAccessNav } from "@/app/lib/users/groups-repository";

export async function GET() {
  noStore();

  const session = await getCurrentUserAccess();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (
    !canAccessNav(session.access, "estimate") &&
    !canAccessNav(session.access, "projects")
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const positions = await listPositionPricesForHints();

  return Response.json(
    { positions },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
