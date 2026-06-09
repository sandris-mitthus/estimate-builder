import { ListEntryGrid } from "@/app/components/list-entry-card";
import { ProjectCard } from "@/app/components/project-card";
import type { ProjectSummary } from "@/app/lib/projects/types";

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  return (
    <ListEntryGrid>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </ListEntryGrid>
  );
}
