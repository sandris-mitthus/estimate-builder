import { ListEntryCard, ListEntryGrid } from "@/app/components/list-entry-card";
import type { ProjectSummary } from "@/app/lib/projects/types";

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  return (
    <ListEntryGrid>
      {projects.map((project) => (
        <ListEntryCard
          key={project.id}
          href={`/projekti/${project.id}`}
          primaryLabel="Nosaukums"
          primaryValue={project.name}
          secondaryLabel="Adrese"
          secondaryValue={project.address}
        />
      ))}
    </ListEntryGrid>
  );
}
