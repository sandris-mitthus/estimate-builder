import { ListEntryCard, ListEntryGrid } from "@/app/components/list-entry-card";
import { SectionPage } from "@/app/components/section-page";
import { SAMPLE_DEFINED_BLOCKS } from "@/app/lib/definetie-bloki/sample-blocks";

export default function DefinetieBlokiPage() {
  return (
    <SectionPage
      title="Definētie bloki"
      subtitle={`${SAMPLE_DEFINED_BLOCKS.length} bloki bibliotēkā`}
    >
      <ListEntryGrid>
        {SAMPLE_DEFINED_BLOCKS.map((block) => (
          <ListEntryCard
            key={block.id}
            primaryLabel="Nosaukums"
            primaryValue={block.name}
            secondaryLabel="Apraksts"
            secondaryValue={block.description}
          />
        ))}
      </ListEntryGrid>
    </SectionPage>
  );
}
