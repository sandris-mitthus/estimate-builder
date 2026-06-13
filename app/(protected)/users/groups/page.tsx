import Link from "next/link";
import { UserGroupsPermissionsForm } from "@/app/components/user-groups-permissions-form";
import { SectionPage } from "@/app/components/section-page";
import { assertUserGroupsPageAccess } from "@/app/lib/auth/assert-nav-access";
import { getCurrentUserAccess } from "@/app/lib/auth/require-permission";
import {
  canPerformAction,
  listUserGroups,
} from "@/app/lib/users/groups-repository";

export default async function UserGroupsPage() {
  await assertUserGroupsPageAccess();

  const [groups, session] = await Promise.all([
    listUserGroups(),
    getCurrentUserAccess(),
  ]);

  const canManage = session
    ? canPerformAction(session.access, "groups.manage")
    : false;

  return (
    <SectionPage
      title="Grupas un tiesības"
      subtitle="Konfigurē, ko katra grupa redz un ko drīkst darīt"
      actions={
        <Link
          href="/users"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
          Atpakaļ uz lietotājiem
        </Link>
      }
    >
      <UserGroupsPermissionsForm groups={groups} canManage={canManage} />
    </SectionPage>
  );
}
