import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateTable } from "@/app/components/estimate-table";
import { getProject, getProjectEstimate } from "@/app/lib/projects/repository";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, estimate] = await Promise.all([
    getProject(id),
    getProjectEstimate(id),
  ]);

  if (!project || !estimate) {
    notFound();
  }

  return (
    <main className="page">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
        Atpakaļ uz projektiem
      </Link>
      <EstimateTable
        initialTitle={estimate.title}
        initialMeta={estimate.meta}
        initialCategories={estimate.categories}
      />
    </main>
  );
}
