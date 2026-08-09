import { SectionPage } from "@/app/components/section-page";
import { SitePaymentPlansForm } from "@/app/components/site-payment-plans-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import {
  getTrialSettings,
  isPaymentPlansEnabled,
  listPaymentPlans,
} from "@/app/lib/payment-plans/repository";
import { listFrontendModules } from "@/app/lib/frontend-modules/repository";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";

export default async function SitePaymentPlansPage() {
  await assertSystemAdminAccess();
  const [enabled, plans, modules, languages, trial, { t }] = await Promise.all([
    isPaymentPlansEnabled(),
    listPaymentPlans(),
    listFrontendModules(),
    listSiteLanguages(),
    getTrialSettings(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("nav.system_admin.site_payment_plans", "Maksas plāni")}
      subtitle={t(
        "site_payment_plans.page.subtitle",
        "Ieslēdz maksas plānus un piešķir frontend moduļus katram plānam",
      )}
    >
      <SitePaymentPlansForm
        initialEnabled={enabled}
        initialPlans={plans}
        initialTrial={trial}
        modules={modules}
        languages={languages}
      />
    </SectionPage>
  );
}
