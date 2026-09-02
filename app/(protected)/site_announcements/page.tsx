import { SectionPage } from "@/app/components/section-page";
import { SiteAnnouncementsForm } from "@/app/components/site-announcements-form";
import { listSiteAnnouncements } from "@/app/lib/announcements/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";

export default async function SiteAnnouncementsPage() {
  await assertSystemAdminAccess();
  const [announcements, languages, { t }] = await Promise.all([
    listSiteAnnouncements(),
    listSiteLanguages(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("nav.system_admin.site_announcements", "Paziņojumi")}
      subtitle={t(
        "site_announcements.page.subtitle",
        "Globāli paziņojumi visiem lietotājiem ar termiņu un ieslēgšanas slēdzi",
      )}
    >
      <SiteAnnouncementsForm
        initialAnnouncements={announcements}
        languages={languages}
      />
    </SectionPage>
  );
}
