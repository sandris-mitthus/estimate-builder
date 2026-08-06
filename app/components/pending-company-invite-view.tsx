"use client";

import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";

export function PendingCompanyInviteView() {
  const { t } = useTranslations();

  return (
    <SectionPage
      title={t("register_company.pending.title", "Gaidi uzaicinājumu")}
      subtitle={t(
        "register_company.pending.description",
        "Tu esi uzaicināts uzņēmumā. Atver e-pastā saņemto saiti, lai apstiprinātu piekļuvi. Kamēr tas nav izdarīts, sistēmu lietot nevar.",
      )}
    >
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm md:p-6">
        {t(
          "register_company.pending.hint",
          "Ja e-pasta nav, pārbaudi spam mapi vai paprasi administratoram nosūtīt uzaicinājumu vēlreiz.",
        )}
      </div>
    </SectionPage>
  );
}
