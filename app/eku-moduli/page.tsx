import { ListEntryCard, ListEntryGrid } from "@/app/components/list-entry-card";
import { SectionPage } from "@/app/components/section-page";
import { SAMPLE_BUILDING_MODULES } from "@/app/lib/eku-moduli/sample-modules";

export default function EkuModuliPage() {
  return (
    <SectionPage
      title="Eku moduļi"
      subtitle={`${SAMPLE_BUILDING_MODULES.length} moduļi katalogā`}
    >
      <ListEntryGrid>
        {SAMPLE_BUILDING_MODULES.map((module) => (
          <ListEntryCard
            key={module.id}
            primaryLabel="Nosaukums"
            primaryValue={module.name}
            secondaryLabel="Adrese"
            secondaryValue={module.address}
          />
        ))}
      </ListEntryGrid>
    </SectionPage>
  );
}
