import { WorkersPageContent } from "@/app/components/workers-page-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";
import { listTools } from "@/app/lib/tools/repository";
import { listWorkers } from "@/app/lib/workers/repository";

export default async function WorkersPage() {
  const session = await assertNavAccess("workers");
  if (!session) {
    return null;
  }

  const enabledFrontendModules = await getEnabledFrontendModuleKeys();
  const toolsModuleEnabled = enabledFrontendModules.has(FRONTEND_MODULE_KEYS.tools);
  const [workers, tools] = await Promise.all([
    listWorkers(),
    toolsModuleEnabled ? listTools() : Promise.resolve([]),
  ]);

  return (
    <WorkersPageContent
      initialWorkers={workers}
      tools={tools}
      toolsModuleEnabled={toolsModuleEnabled}
    />
  );
}
