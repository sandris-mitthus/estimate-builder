import { ToolsPageContent } from "@/app/components/tools-page-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";
import { listTools } from "@/app/lib/tools/repository";
import { listWorkers } from "@/app/lib/workers/repository";

export default async function ToolsPage() {
  const session = await assertNavAccess("tools");
  if (!session) {
    return null;
  }

  const enabledFrontendModules = await getEnabledFrontendModuleKeys();
  const workersModuleEnabled = enabledFrontendModules.has(FRONTEND_MODULE_KEYS.workers);
  const [tools, workers] = await Promise.all([
    listTools(),
    workersModuleEnabled ? listWorkers() : Promise.resolve([]),
  ]);

  return (
    <ToolsPageContent
      initialTools={tools}
      workers={workers}
      workersModuleEnabled={workersModuleEnabled}
    />
  );
}
