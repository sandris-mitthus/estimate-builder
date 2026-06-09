import { ListEntryCard, ListEntryGrid } from "@/app/components/list-entry-card";
import { SectionPage } from "@/app/components/section-page";
import { SAMPLE_POSITION_PRICES } from "@/app/lib/positions/sample-prices";

export default function PositionsPage() {
  return (
    <SectionPage
      title="Cenu pozicijas"
      subtitle={`${SAMPLE_POSITION_PRICES.length} pozīcijas katalogā`}
    >
      <ListEntryGrid>
        {SAMPLE_POSITION_PRICES.map((position) => (
          <ListEntryCard
            key={position.id}
            primaryLabel="Nosaukums"
            primaryValue={position.name}
            secondaryLabel="Mērvienība"
            secondaryValue={position.unit}
          />
        ))}
      </ListEntryGrid>
    </SectionPage>
  );
}
