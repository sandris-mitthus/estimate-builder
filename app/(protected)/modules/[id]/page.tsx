import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleDetailContent } from "@/app/components/module-detail-content";
import { getBuildingModule } from "@/app/lib/modules/repository";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mod = await getBuildingModule(id);

  if (!mod) {
    notFound();
  }

  return (
    <main className="page">
      <Link
        href="/modules"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
        Atpakaļ uz moduļiem
      </Link>

      <ModuleDetailContent module={mod} />
    </main>
  );
}
