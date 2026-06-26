import { TimelinePageContent } from "@/app/components/timeline-page-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { listTimelineEntries } from "@/app/lib/timeline/repository";

export default async function TimelinePage() {
  const session = await assertNavAccess("timeline");
  if (!session) {
    return null;
  }

  const entries = await listTimelineEntries();

  return <TimelinePageContent initialEntries={entries} />;
}
