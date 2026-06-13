import type { PendingProjectMaterialsSummary } from "@/app/lib/projects/pending-project-materials";

type PendingProjectMaterialsBannerProps = {
  summary: PendingProjectMaterialsSummary;
  className?: string;
};

export function PendingProjectMaterialsBanner({
  summary,
  className = "",
}: PendingProjectMaterialsBannerProps) {
  if (summary.totalCount === 0 || summary.pendingCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className={`flex items-center gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3.5 text-base font-semibold text-orange-900 ${className}`.trim()}
    >
      <i className="fas fa-box-open text-sm" aria-hidden="true" />
      <span>
        Visi materiāli vēl nav pasūtīti!{" "}
        <span className="text-sm font-normal text-orange-800">
          Atlikuši {summary.pendingCount} no {summary.totalCount}.
        </span>
      </span>
    </div>
  );
}

export function PendingProjectMaterialsCardHint() {
  return (
    <p
      role="status"
      className="mt-4 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-semibold text-orange-900"
    >
      <i className="fas fa-box-open text-sm" aria-hidden="true" />
      Visi materiāli vēl nav pasūtīti!
    </p>
  );
}
