import { ListEntryCard, ListEntryGrid } from "@/app/components/list-entry-card";
import { SectionPage } from "@/app/components/section-page";
import { SAMPLE_USERS } from "@/app/lib/lietotaji/sample-users";

export default function LietotajiPage() {
  return (
    <SectionPage
      title="Lietotāji"
      subtitle={`${SAMPLE_USERS.length} lietotāji sistēmā`}
    >
      <ListEntryGrid>
        {SAMPLE_USERS.map((user) => (
          <ListEntryCard
            key={user.id}
            primaryLabel="Nosaukums"
            primaryValue={user.name}
            secondaryLabel="E-pasts"
            secondaryValue={user.email}
          />
        ))}
      </ListEntryGrid>
    </SectionPage>
  );
}
