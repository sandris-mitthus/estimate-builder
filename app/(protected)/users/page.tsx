import Link from "next/link";
import { InviteUserButton } from "@/app/components/invite-user-button";
import { ListEntryGrid } from "@/app/components/list-entry-card";
import { SectionPage } from "@/app/components/section-page";
import { UserGroupSelect } from "@/app/components/user-group-select";
import { UserListCard } from "@/app/components/user-list-card";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getCurrentUserAccess } from "@/app/lib/auth/require-permission";
import {
  canPerformAction,
  listUserGroupMemberships,
  listUserGroups,
  getDefaultNewUserGroupId,
} from "@/app/lib/users/groups-repository";
import { listUsers } from "@/app/lib/users/repository";

export default async function UsersPage() {
  await assertNavAccess("users");

  const [users, groups, memberships, session] = await Promise.all([
    listUsers(),
    listUserGroups(),
    listUserGroupMemberships(),
    getCurrentUserAccess(),
  ]);

  const canInvite = session
    ? canPerformAction(session.access, "users.invite")
    : false;
  const canAssignGroup = session
    ? canPerformAction(session.access, "users.assign_group")
    : false;
  const canManageGroups = session
    ? canPerformAction(session.access, "groups.manage")
    : false;

  const defaultGroupId = getDefaultNewUserGroupId(groups);

  return (
    <SectionPage
      title="Lietotāji"
      subtitle={`${users.length} lietotāji sistēmā`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {canManageGroups ? (
            <Link
              href="/users/groups"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <i className="fas fa-shield-halved text-xs" aria-hidden="true" />
              Grupas un tiesības
            </Link>
          ) : null}
          {canInvite ? <InviteUserButton /> : null}
        </div>
      }
    >
      <ListEntryGrid>
        {users.map((user) => (
          <UserListCard
            key={user.id}
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
            footer={
              canAssignGroup ? (
                <UserGroupSelect
                  userId={user.id}
                  groupId={memberships[user.id] ?? defaultGroupId}
                  groups={groups}
                />
              ) : null
            }
          />
        ))}
      </ListEntryGrid>
    </SectionPage>
  );
}
