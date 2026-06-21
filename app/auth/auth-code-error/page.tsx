import Link from "next/link";
import { getServerTranslations } from "@/app/lib/i18n/server";

export default async function AuthCodeErrorPage() {
  const { t } = await getServerTranslations();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f4f5] px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold text-[#18181b]">
          {t("auth.error_page.title", "Pierakstīšanās neizdevās")}
        </h1>
        <p className="mt-2 text-sm text-[#52525b]">
          {t(
            "auth.error_page.description",
            "Autorizācijas kods nav derīgs vai ir beidzies. Mēģini vēlreiz.",
          )}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-[#2563eb] hover:underline"
        >
          {t("auth.error_page.back_to_login", "Atpakaļ uz pierakstīšanos")}
        </Link>
      </div>
    </main>
  );
}
