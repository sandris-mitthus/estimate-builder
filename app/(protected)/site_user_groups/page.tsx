import { SectionPage } from "@/app/components/section-page";
import { SiteUserGroupsPermissionsForm } from "@/app/components/site-user-groups-permissions-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteUserGroups } from "@/app/lib/site-admin/repository";

export default async function SiteUserGroupsPage() {
  await assertSystemAdminAccess();
  const [groups, { t }] = await Promise.all([
    listSiteUserGroups(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("nav.system_admin.site_user_groups", "Grupas")}
      subtitle={t(
        "site_user_groups.page.subtitle",
        "Sistēmas noklusējuma lietotāju grupas un pieejas",
      )}
    >
      <SiteUserGroupsPermissionsForm groups={groups} />
    </SectionPage>
  );
}
