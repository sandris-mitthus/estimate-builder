import { ToolsPageContent } from "@/app/components/tools-page-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { listTools } from "@/app/lib/tools/repository";
import { listWorkers } from "@/app/lib/workers/repository";

export default async function ToolsPage() {
  const session = await assertNavAccess("tools");
  if (!session) {
    return null;
  }

  const [tools, workers] = await Promise.all([listTools(), listWorkers()]);

  return <ToolsPageContent initialTools={tools} workers={workers} />;
}
