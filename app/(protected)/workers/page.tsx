import { WorkersPageContent } from "@/app/components/workers-page-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { listWorkers } from "@/app/lib/workers/repository";

export default async function WorkersPage() {
  const session = await assertNavAccess("workers");
  if (!session) {
    return null;
  }

  const workers = await listWorkers();

  return <WorkersPageContent initialWorkers={workers} />;
}
