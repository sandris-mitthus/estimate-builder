"use client";

import { CompanySettingsForm } from "@/app/components/company-settings-form";
import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";
import { DEFAULT_COMPANY_SETTINGS } from "@/app/lib/settings/defaults";

export function RegisterCompanyView({ userEmail }: { userEmail: string }) {
  const { t } = useTranslations();

  return (
    <SectionPage
      title={t("register_company.title", "Reģistrē savu uzņēmumu")}
      subtitle={t(
        "register_company.description",
        "Lai lietotu sistēmu, tev jābūt piesaistītam uzņēmumam. Aizpildi pamata datus — pārējo vari papildināt vēlāk iestatījumos.",
      )}
    >
      <CompanySettingsForm
        mode="register"
        initialSettings={{
          ...DEFAULT_COMPANY_SETTINGS,
          email: userEmail,
        }}
      />
    </SectionPage>
  );
}
