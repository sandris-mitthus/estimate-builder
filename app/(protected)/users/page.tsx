import { InviteUserButton } from "@/app/components/invite-user-button";
import { ListEntryGrid } from "@/app/components/list-entry-card";
import { SectionPage } from "@/app/components/section-page";
import { UserListCard } from "@/app/components/user-list-card";
import { listUsers } from "@/app/lib/users/repository";

export default async function UsersPage() {
  const users = await listUsers();

  return (
    <SectionPage
      title="Lietotāji"
      subtitle={`${users.length} lietotāji sistēmā`}
      actions={<InviteUserButton />}
    >
      <ListEntryGrid>
        {users.map((user) => (
          <UserListCard
            key={user.id}
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
          />
        ))}
      </ListEntryGrid>
    </SectionPage>
  );
}
