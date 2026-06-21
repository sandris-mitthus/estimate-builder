import Link from "next/link";
import { InviteUserButton } from "@/app/components/invite-user-button";
import { ListEntryGrid } from "@/app/components/list-entry-card";
import { SectionPage } from "@/app/components/section-page";
import { UserCompanyActions } from "@/app/components/user-company-actions";
import { UserGroupSelect } from "@/app/components/user-group-select";
import { UserListCard } from "@/app/components/user-list-card";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getServerTranslations } from "@/app/lib/i18n/server";
import type { ServerTranslations } from "@/app/lib/i18n/server";
import {
  canPerformAction,
  listUserGroupMemberships,
  listUserGroups,
  getDefaultNewUserGroupId,
} from "@/app/lib/users/groups-repository";
import { listUsers } from "@/app/lib/users/repository";

function statusLabel(
  status: (Awaited<ReturnType<typeof listUsers>>)[number]["companyStatus"],
  t: ServerTranslations["t"],
) {
  if (status === "disabled") {
    return t("user_status.disabled", "Pieeja liegta");
  }

  if (status === "invited") {
    return t("user_status.invited", "Uzaicināts");
  }

  return null;
}

export default async function UsersPage() {
  const session = await assertNavAccess("users");
  if (!session) {
    return null;
  }

  const [{ t }, users, groups, memberships] = await Promise.all([
    getServerTranslations(),
    listUsers(),
    listUserGroups(),
    listUserGroupMemberships(),
  ]);

  const canInvite = canPerformAction(session.access, "users.invite");
  const canAssignGroup = canPerformAction(session.access, "users.assign_group");
  const canManageGroups = canPerformAction(session.access, "groups.manage");
  const canManageCompanyAccess = canPerformAction(
    session.access,
    "users.manage_company_access",
  ) || canManageGroups;

  const defaultGroupId = getDefaultNewUserGroupId(groups);

  return (
    <SectionPage
      title={t("nav.users", "Lietotāji")}
      subtitle={t("users.page.subtitle", "{count} lietotāji sistēmā", {
        count: users.length,
      })}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {canManageGroups ? (
            <Link
              href="/users/groups"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <i className="fas fa-shield-halved text-xs" aria-hidden="true" />
              {t("nav.user_groups", "Grupas un tiesības")}
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
            statusLabel={statusLabel(user.companyStatus, t)}
            actions={
              <UserCompanyActions
                userId={user.id}
                userName={user.name}
                status={user.companyStatus}
                canManageCompanyAccess={canManageCompanyAccess}
                isCurrentUser={
                  session.user?.id === user.id ||
                  session.user?.email?.toLowerCase() === user.email.toLowerCase()
                }
              />
            }
            footer={
              canAssignGroup ? (
                <UserGroupSelect
                  userId={user.id}
                  groupId={memberships[user.id] ?? defaultGroupId}
                  groups={groups}
                  disabled={user.companyStatus === "disabled"}
                />
              ) : null
            }
          />
        ))}
      </ListEntryGrid>
    </SectionPage>
  );
}
