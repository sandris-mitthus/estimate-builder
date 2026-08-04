import { TimelineGraphPageContent } from "@/app/components/timeline-graph-page-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { listTimelineGraphProjects } from "@/app/lib/timeline-graph/repository";

export default async function TimelineGraphPage() {
  const session = await assertNavAccess("timeline_graph");
  if (!session) {
    return null;
  }

  const projects = await listTimelineGraphProjects();

  return <TimelineGraphPageContent projects={projects} />;
}
