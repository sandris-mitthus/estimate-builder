import { ExcludedPositionsPageContent } from "@/app/components/excluded-positions-page-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { listExcludedPositions } from "@/app/lib/excluded-positions/repository";

export default async function ExcludedPositionsPage() {
  await assertNavAccess("excluded_positions");

  const positions = await listExcludedPositions();

  return <ExcludedPositionsPageContent initialPositions={positions} />;
}
